import { FormEvent, useEffect, useState } from "react";
import { collectNewsByDate, collectRecentNews, listNewsArticles } from "../api/newsApi";
import type { NewsArticle, NewsCollectionResponse } from "../types/news";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [targetDate, setTargetDate] = useState(todayKey());
  const [lastResult, setLastResult] = useState<NewsCollectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setError(null);
      setArticles(await listNewsArticles({ limit: 100 }));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }

  async function handleCollectByDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runCollection(() => collectNewsByDate(targetDate));
  }

  async function handleCollectRecent() {
    await runCollection(() => collectRecentNews());
  }

  async function runCollection(collector: () => Promise<NewsCollectionResponse>) {
    try {
      setIsLoading(true);
      setError(null);
      const result = await collector();
      setLastResult(result);
      await loadArticles();
    } catch (collectError) {
      setError(getErrorMessage(collectError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="news-workspace">
      <section className="schedule-card news-toolbar">
        <div>
          <p className="eyebrow">Policy News</p>
          <h3>대한민국 정책브리핑 수집</h3>
        </div>
        <div className="news-actions">
          <form onSubmit={handleCollectByDate}>
            <input
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
            <button type="submit" disabled={isLoading}>
              선택일 수집
            </button>
          </form>
          <button type="button" disabled={isLoading} onClick={handleCollectRecent}>
            전날~현재 수집
          </button>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      {lastResult ? (
        <section className="news-summary">
          <article>
            <strong>{lastResult.collectedCount}</strong>
            <span>수집</span>
          </article>
          <article>
            <strong>{lastResult.insertedCount}</strong>
            <span>신규 저장</span>
          </article>
          <article>
            <strong>{lastResult.skippedCount}</strong>
            <span>중복 제외</span>
          </article>
        </section>
      ) : null}

      <section className="schedule-card">
        <div className="section-heading">
          <h4>저장된 기사</h4>
          <span>{isLoading ? "수집 중..." : `${articles.length}건`}</span>
        </div>
        <div className="news-list">
          {articles.map((article) => (
            <article className="news-item" key={article.id}>
              <div className="news-item-head">
                <strong>{article.title}</strong>
                <span>{article.publishedAt || article.collectedAt}</span>
              </div>
              <p>{article.summary || "요약 없음"}</p>
              <div className="news-item-foot">
                <span>{article.source}</span>
                <a href={article.url} rel="noreferrer" target="_blank">
                  원문 보기
                </a>
              </div>
            </article>
          ))}
          {articles.length === 0 ? (
            <p className="empty-state">아직 저장된 정책뉴스가 없습니다.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";
}
