# 공공직군 행정업무 슈퍼앱 Architecture

## 1. 문서 목적

본 문서는 공공직군 행정업무 슈퍼앱의 기술적 요구사항, 프로젝트 구조, 모듈별 역할, 데이터 흐름을 정의한다. 현재 기술스택은 Frontend: TypeScript + Vite + React, Backend: Python + FastAPI + uv, Database: SQLite로 한다.

## 2. 기술 스택

| 영역 | 기술 | 용도 |
| --- | --- | --- |
| Frontend | TypeScript | 정적 타입 기반 UI 개발 |
| Frontend | Vite | 개발 서버, 번들링, 빌드 |
| Frontend | React | 화면 컴포넌트 구성 |
| Backend | Python | API 서버 및 업무 로직 |
| Backend | FastAPI | REST API, 요청 검증, 문서화 |
| Backend | uv | Python 가상환경 및 의존성 관리 |
| Database | SQLite | MVP 단계 로컬 관계형 데이터 저장 |
| File Processing | openpyxl 또는 pandas | 엑셀 파일 처리 후보 |
| Scheduler | APScheduler 또는 OS 스케줄러 | 뉴스 수집 정기 실행 후보 |

## 3. 전체 구조

```text
day3_rpa/
  frontend/
    package.json
    package-lock.json
    node_modules/
    src/                 # 추후 FE 코드 위치
  backend/
    pyproject.toml
    uv.lock
    .venv/
    app/                 # 추후 BE 코드 위치
    data/                # SQLite DB, 임시 데이터 위치 후보
  docs/
    PRD.md
    Architecture.md
    Operation.md
    index.html
```

현재 단계에서는 개발환경과 문서화를 우선하며, 실제 애플리케이션 코드는 이후 단계에서 작성한다.

## 4. 아키텍처 개요

```text
[사용자 브라우저]
        |
        v
[React + Vite Frontend]
        |
        | HTTP/JSON, 파일 업로드
        v
[FastAPI Backend]
        |
        | SQL
        v
[SQLite Database]
        |
        +-- 임시 엑셀 파일 저장소
        +-- 민원 매뉴얼 파일 저장소
        +-- 뉴스 수집 결과 저장소
```

## 5. Frontend 구조

### 5.1 역할

- 사용자 화면 제공
- 캘린더 UI 표시
- 엑셀 파일 업로드/다운로드 인터페이스 제공
- 민원 챗봇 입력/응답 화면 제공
- 뉴스 목록 및 필터 화면 제공
- FastAPI와 HTTP API 통신

### 5.2 추천 모듈 구조

```text
frontend/src/
  main.tsx
  App.tsx
  routes/
    CalendarPage.tsx
    ExcelAutomationPage.tsx
    ComplaintChatbotPage.tsx
    NewsPage.tsx
  components/
    layout/
    calendar/
    upload/
    chatbot/
    news/
  api/
    client.ts
    calendarApi.ts
    excelApi.ts
    chatbotApi.ts
    newsApi.ts
  types/
    calendar.ts
    excel.ts
    chatbot.ts
    news.ts
```

### 5.3 화면 단위

| 화면 | 설명 |
| --- | --- |
| 대시보드 | 오늘 일정, 최근 엑셀 작업, 주요 뉴스 요약 |
| 팀원 스케줄 | 월/주/일 캘린더와 일정 등록 폼 |
| 엑셀 자동화 | 파일 업로드, 기준 컬럼 선택, 결과 다운로드 |
| 민원 챗봇 | 민원 내용 입력, 답변 초안 확인 |
| 뉴스 수집 | 기사 목록, 키워드 필터, 수집 일자 조회 |

## 6. Backend 구조

### 6.1 역할

- REST API 제공
- 요청 데이터 검증
- SQLite 데이터 읽기/쓰기
- 엑셀 파일 분석, 분리, 병합
- 민원 매뉴얼 검색 및 답변 생성 로직 연결
- 뉴스 수집 작업 실행 및 결과 저장

### 6.2 추천 모듈 구조

```text
backend/app/
  main.py
  core/
    config.py
    database.py
    security.py
  api/
    routes/
      calendar.py
      excel.py
      chatbot.py
      news.py
  models/
    calendar.py
    excel_job.py
    complaint.py
    news.py
  schemas/
    calendar.py
    excel.py
    chatbot.py
    news.py
  services/
    calendar_service.py
    excel_service.py
    chatbot_service.py
    news_service.py
  repositories/
    calendar_repository.py
    excel_repository.py
    chatbot_repository.py
    news_repository.py
  storage/
    uploads/
    outputs/
    manuals/
  tests/
```

### 6.3 모듈별 책임

| 모듈 | 책임 |
| --- | --- |
| `api/routes` | HTTP 엔드포인트 정의 |
| `schemas` | 요청/응답 DTO, Pydantic 검증 |
| `services` | 업무 규칙과 유스케이스 처리 |
| `repositories` | DB 접근 로직 |
| `models` | DB 테이블 모델 |
| `core/database.py` | SQLite 연결, 세션 관리 |
| `storage` | 업로드/결과/매뉴얼 파일 저장 |

## 7. API 설계 초안

### 7.1 팀원 스케줄

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/calendar/events` | 일정 목록 조회 |
| POST | `/api/calendar/events` | 일정 생성 |
| GET | `/api/calendar/events/{event_id}` | 일정 단건 조회 |
| PUT | `/api/calendar/events/{event_id}` | 일정 수정 |
| DELETE | `/api/calendar/events/{event_id}` | 일정 삭제 |

### 7.2 엑셀 자동화

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/excel/analyze` | 엑셀 파일 분석 및 컬럼 목록 반환 |
| POST | `/api/excel/split` | 기준 컬럼별 엑셀 분리 |
| POST | `/api/excel/merge` | 여러 엑셀 파일 병합 |
| GET | `/api/excel/jobs/{job_id}` | 처리 상태 조회 |
| GET | `/api/excel/jobs/{job_id}/download` | 결과 다운로드 |

### 7.3 민원 챗봇

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/chatbot/manuals` | 민원 매뉴얼 업로드 |
| GET | `/api/chatbot/manuals` | 매뉴얼 목록 조회 |
| POST | `/api/chatbot/respond` | 민원 대응 초안 생성 |
| GET | `/api/chatbot/history` | 답변 이력 조회 |

### 7.4 뉴스 수집

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/news` | 뉴스 목록 조회 |
| POST | `/api/news/collect` | 뉴스 수집 수동 실행 |
| GET | `/api/news/keywords` | 수집 키워드 조회 |
| PUT | `/api/news/keywords` | 수집 키워드 수정 |

## 8. 데이터베이스 설계 초안

### 8.1 주요 테이블

```text
users
  id
  name
  department
  role
  created_at

calendar_events
  id
  title
  event_type
  user_id
  starts_at
  ends_at
  location
  memo
  created_at
  updated_at

excel_jobs
  id
  job_type
  original_filename
  status
  result_path
  error_message
  created_at
  completed_at

complaint_manuals
  id
  filename
  stored_path
  uploaded_at

complaint_responses
  id
  complaint_text
  response_text
  source_manual_id
  created_at

news_articles
  id
  title
  source
  published_at
  url
  keyword
  summary
  collected_at
```

### 8.2 SQLite 사용 기준

- MVP 및 로컬 개발 단계에서 SQLite를 사용한다.
- DB 파일은 `backend/data/app.db` 위치를 기본 후보로 한다.
- 동시 쓰기 요청이 많은 운영 환경에서는 PostgreSQL 전환을 검토한다.
- 마이그레이션 도구는 Alembic 도입을 고려한다.

## 9. 주요 데이터 흐름

### 9.1 일정 등록

```text
사용자 입력 -> React Form -> POST /api/calendar/events -> FastAPI 검증 -> SQLite 저장 -> 일정 목록 갱신
```

### 9.2 엑셀 분리

```text
파일 업로드 -> 임시 저장 -> 컬럼 분석 -> 기준 컬럼 선택 -> 분리 처리 -> 결과 파일 생성 -> 다운로드 링크 반환 -> 임시 파일 정리
```

### 9.3 민원 답변 생성

```text
민원 입력 -> 매뉴얼 검색 -> 관련 항목 추출 -> 답변 초안 생성 -> 근거와 주의사항 반환 -> 이력 저장
```

### 9.4 뉴스 수집

```text
스케줄러 실행 -> 키워드별 기사 검색 -> 중복 제거 -> 제목/URL/출처 저장 -> 화면에서 조회
```

## 10. 보안 및 개인정보 고려사항

- 업로드 파일은 임시 저장 후 자동 삭제한다.
- 파일명은 원본 그대로 저장하지 말고 내부 식별자로 변환한다.
- 민원 내용에는 개인정보가 포함될 수 있으므로 로그 출력에 주의한다.
- 챗봇 답변은 참고용이며 최종 답변 전 담당자 검토가 필요하다는 안내를 제공한다.
- 운영 환경에서는 CORS 허용 범위를 명확히 제한한다.

## 11. 개발 원칙

- API와 UI는 기능 도메인별로 분리한다.
- 엑셀 처리, 뉴스 수집, 챗봇 로직은 `service` 계층에 둔다.
- DB 접근은 repository 계층에 모아 테스트 가능성을 높인다.
- 초기에는 단순 구현을 우선하되, 파일 처리와 챗봇 기능은 추후 비동기 작업으로 확장 가능하게 한다.
- 문서와 실제 구조가 달라지면 문서를 함께 갱신한다.
