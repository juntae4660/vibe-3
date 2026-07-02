from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from fastapi import HTTPException, status

from app.core.database import get_connection, initialize_database
from app.repositories import news_repository

KOREA_POLICY_NEWS_URL = "https://www.korea.kr/news/policyNewsList.do"
BASE_URL = "https://www.korea.kr"
REQUEST_TIMEOUT = 15
MAX_PAGES = 8


@dataclass
class CrawledArticle:
    title: str
    source: str
    summary: str | None
    published_at: str | None
    url: str
    category: str | None = "정책뉴스"


def list_articles(
    start_date: str | None = None,
    end_date: str | None = None,
    limit: int = 100,
) -> list[dict]:
    initialize_database()
    with get_connection() as connection:
        return news_repository.list_articles(connection, start_date, end_date, limit)


def collect_target_date(target_date: str) -> dict:
    parsed_date = _parse_date(target_date)
    articles = _crawl_policy_news(parsed_date, parsed_date)
    return _save_collection_result(parsed_date.isoformat(), articles)


def collect_since_yesterday() -> dict:
    today = date.today()
    yesterday = today - timedelta(days=1)
    articles = _crawl_policy_news(yesterday, today)
    return _save_collection_result(f"{yesterday.isoformat()}~{today.isoformat()}", articles)


def _crawl_policy_news(start_date: date, end_date: date) -> list[CrawledArticle]:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
            )
        }
    )

    collected: list[CrawledArticle] = []
    seen_urls: set[str] = set()

    for page in range(1, MAX_PAGES + 1):
        response = session.get(
            KOREA_POLICY_NEWS_URL,
            params={"pageIndex": page},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        links = _extract_article_links(soup)

        if not links:
            break

        found_in_range_on_page = False
        for url in links:
            if url in seen_urls:
                continue
            seen_urls.add(url)

            article = _crawl_article_detail(session, url)
            if article.published_at is None:
                continue

            published_date = _parse_date(article.published_at)
            if start_date <= published_date <= end_date:
                collected.append(article)
                found_in_range_on_page = True
            elif published_date < start_date:
                return collected

        if not found_in_range_on_page and page > 1:
            break

    return collected


def _extract_article_links(soup: BeautifulSoup) -> list[str]:
    links: list[str] = []
    for anchor in soup.select("a[href]"):
        href = anchor.get("href", "")
        text = _clean_text(anchor.get_text(" ", strip=True))
        if "policyNewsView.do" not in href:
            continue
        if len(text) < 8:
            continue
        links.append(urljoin(BASE_URL, href))
    return links


def _crawl_article_detail(session: requests.Session, url: str) -> CrawledArticle:
    response = session.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    title = _first_text(
        soup,
        [
            "h1",
            ".view_title",
            ".article_head h2",
            ".news_view h2",
            "meta[property='og:title']",
        ],
    )
    title = title.replace("| 대한민국 정책브리핑", "").strip()
    body_text = _first_text(
        soup,
        [
            ".view_cont",
            ".article_body",
            ".news_view",
            "#contents",
            "article",
        ],
    )
    source = _extract_source(soup, body_text)
    published_at = _extract_date(soup.get_text(" ", strip=True))
    summary = _clean_text(body_text)[:500] if body_text else None

    return CrawledArticle(
        title=title or "제목 없음",
        source=source,
        summary=summary,
        published_at=published_at,
        url=url,
    )


def _first_text(soup: BeautifulSoup, selectors: list[str]) -> str:
    for selector in selectors:
        element = soup.select_one(selector)
        if element is None:
            continue
        if element.name == "meta":
            content = element.get("content")
            if content:
                return _clean_text(content)
        text = _clean_text(element.get_text(" ", strip=True))
        if text:
            return text
    return ""


def _extract_source(soup: BeautifulSoup, body_text: str) -> str:
    import re

    page_text = soup.get_text(" ", strip=True)
    date_source_match = re.search(
        r"20\d{2}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}\s+([가-힣·]+(?:부|처|청|위원회))",
        page_text,
    )
    if date_source_match:
        return date_source_match.group(1)

    for token in page_text.split():
        if token == "전자정부":
            continue
        if token.endswith("부") or token.endswith("처") or token.endswith("청") or token.endswith("위원회"):
            if 2 <= len(token) <= 16:
                return token
    if "문의:" in body_text:
        return _clean_text(body_text.split("문의:", 1)[1]).split(" ")[0]
    return "대한민국 정책브리핑"


def _extract_date(text: str) -> str | None:
    import re

    match = re.search(r"(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})", text)
    if not match:
        return None
    year, month, day = (int(part) for part in match.groups())
    return date(year, month, day).isoformat()


def _save_collection_result(target_date: str, articles: list[CrawledArticle]) -> dict:
    initialize_database()
    saved_articles: list[dict] = []
    inserted_count = 0

    with get_connection() as connection:
        for article in articles:
            saved, inserted = news_repository.create_article_if_missing(
                connection,
                {
                    "title": article.title,
                    "source": article.source,
                    "summary": article.summary,
                    "published_at": article.published_at,
                    "url": article.url,
                    "category": article.category,
                },
            )
            saved_articles.append(saved)
            if inserted:
                inserted_count += 1

    return {
        "targetDate": target_date,
        "collectedCount": len(articles),
        "insertedCount": inserted_count,
        "skippedCount": len(articles) - inserted_count,
        "articles": saved_articles,
    }


def _parse_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="날짜는 YYYY-MM-DD 형식이어야 합니다.",
        ) from exc


def _clean_text(value: str) -> str:
    return " ".join(value.split())
