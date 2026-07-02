import { useEffect, useState, type FormEvent } from "react";
import { getBackendHealth, getDatabaseHealth } from "./api/client";
import { getApiBaseUrl, resetApiBaseUrl, setApiBaseUrl } from "./api/config";
import { CalendarPage } from "./routes/CalendarPage";
import { ComplaintChatbotPage } from "./routes/ComplaintChatbotPage";
import { DashboardPage } from "./routes/DashboardPage";
import { ExcelAutomationPage } from "./routes/ExcelAutomationPage";
import { NewsPage } from "./routes/NewsPage";
import type { HealthResponse } from "./types/system";

type ConnectionStatus = {
  kind: "idle" | "success" | "error";
  message: string;
  checkedAt: string | null;
};

const pages = [
  { id: "dashboard", label: "대시보드", component: <DashboardPage /> },
  { id: "calendar", label: "팀원 일정", component: <CalendarPage /> },
  { id: "excel", label: "엑셀 자동화", component: <ExcelAutomationPage /> },
  { id: "chatbot", label: "민원 챗봇", component: <ComplaintChatbotPage /> },
  { id: "news", label: "뉴스 수집", component: <NewsPage /> },
];

function App() {
  const [activePage, setActivePage] = useState(pages[0].id);
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<HealthResponse | null>(null);
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(getApiBaseUrl());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    kind: "idle",
    message: "백엔드 URL을 입력하고 연결 테스트를 실행하세요.",
    checkedAt: null,
  });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    void runConnectionTest(getApiBaseUrl());
    // 최초 진입 시 현재 저장된 URL 또는 기본 경로로 상태를 확인한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runConnectionTest(baseUrl: string) {
    const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "");
    setIsTesting(true);

    try {
      const [backend, database] = await Promise.all([
        getBackendHealth(normalizedBaseUrl),
        getDatabaseHealth(normalizedBaseUrl),
      ]);

      setBackendHealth(backend);
      setDatabaseHealth(database);
      setConnectionStatus({
        kind: "success",
        message: normalizedBaseUrl
          ? `연결 성공: ${normalizedBaseUrl}`
          : "연결 성공: 현재 경로의 `/api`를 사용 중입니다.",
        checkedAt: new Date().toLocaleString("ko-KR"),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "백엔드 연결을 확인하지 못했습니다.";

      setBackendHealth(null);
      setDatabaseHealth(null);
      setConnectionStatus({
        kind: "error",
        message,
        checkedAt: new Date().toLocaleString("ko-KR"),
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleConnectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const savedBaseUrl = setApiBaseUrl(apiBaseUrlInput);
    setApiBaseUrlInput(savedBaseUrl);
    await runConnectionTest(savedBaseUrl);
  }

  async function handleResetBaseUrl() {
    const resetBaseUrl = resetApiBaseUrl();
    setApiBaseUrlInput(resetBaseUrl);
    await runConnectionTest(resetBaseUrl);
  }

  const currentPage = pages.find((page) => page.id === activePage) ?? pages[0];
  const currentBaseUrl = apiBaseUrlInput.trim().replace(/\/$/, "");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="eyebrow">Admin Super App</p>
        <h1>공공직군 행정업무 슈퍼앱</h1>
        <nav>
          {pages.map((page) => (
            <button
              className={page.id === activePage ? "active" : ""}
              key={page.id}
              onClick={() => setActivePage(page.id)}
              type="button"
            >
              {page.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <section className="connection-panel">
          <div className="section-heading">
            <div>
              <h4>백엔드 연결 설정</h4>
              <span>직접 입력한 URL로 FE-BE 연동을 검사합니다.</span>
            </div>
            <strong className={connectionStatus.kind === "success" ? "status-pill online" : "status-pill"}>
              {connectionStatus.kind === "success"
                ? "연결 성공"
                : connectionStatus.kind === "error"
                  ? "연결 실패"
                  : "대기 중"}
            </strong>
          </div>

          <form className="stack-form connection-form" onSubmit={handleConnectionSubmit}>
            <label className="field-label" htmlFor="api-base-url">
              백엔드 URL
            </label>
            <input
              id="api-base-url"
              onChange={(event) => setApiBaseUrlInput(event.target.value)}
              placeholder="예: http://127.0.0.1:8000 또는 https://xxxx.trycloudflare.com"
              type="url"
              value={apiBaseUrlInput}
            />

            <p className="connection-help">
              비워두면 현재 경로의 `/api`를 사용합니다. GitHub Pages 같은 정적 호스팅에서는
              백엔드의 실제 주소를 넣어야 합니다.
            </p>

            <div className="form-actions">
              <button disabled={isTesting} type="submit">
                {isTesting ? "테스트 중..." : "저장 후 테스트"}
              </button>
              <button disabled={isTesting} type="button" onClick={handleResetBaseUrl}>
                기본값 복원
              </button>
            </div>
          </form>

          <div className="connection-meta">
            <span>현재 설정</span>
            <strong>{currentBaseUrl || "상대 경로 (/api)"}</strong>
            <p className={connectionStatus.kind === "error" ? "connection-message error" : "connection-message"}>
              {connectionStatus.message}
            </p>
            {connectionStatus.checkedAt ? <small>마지막 확인: {connectionStatus.checkedAt}</small> : null}
          </div>
        </section>

        <section className="status-grid" aria-label="연결 상태">
          <StatusCard title="FE-BE 연동" health={backendHealth} />
          <StatusCard title="BE-DB 연동" health={databaseHealth} />
        </section>

        <section className="page-panel">
          <div className="page-title">
            <span>Scaffold</span>
            <h2>{currentPage.label}</h2>
          </div>
          {currentPage.component}
        </section>
      </main>
    </div>
  );
}

function StatusCard({
  title,
  health,
}: {
  title: string;
  health: HealthResponse | null;
}) {
  const isOnline = health?.status === "ok";

  return (
    <article className={isOnline ? "status-card online" : "status-card"}>
      <strong>{title}</strong>
      <span>{isOnline ? "정상" : "확인 필요"}</span>
      <p>{health?.detail ?? "백엔드 서버를 확인 중입니다."}</p>
    </article>
  );
}

export default App;
