import { useEffect, useState } from "react";
import { getBackendHealth, getDatabaseHealth } from "./api/client";
import { CalendarPage } from "./routes/CalendarPage";
import { ComplaintChatbotPage } from "./routes/ComplaintChatbotPage";
import { DashboardPage } from "./routes/DashboardPage";
import { ExcelAutomationPage } from "./routes/ExcelAutomationPage";
import { NewsPage } from "./routes/NewsPage";
import type { HealthResponse } from "./types/system";

const pages = [
  { id: "dashboard", label: "대시보드", component: <DashboardPage /> },
  { id: "calendar", label: "팀원 스케줄", component: <CalendarPage /> },
  { id: "excel", label: "엑셀 자동화", component: <ExcelAutomationPage /> },
  { id: "chatbot", label: "민원 챗봇", component: <ComplaintChatbotPage /> },
  { id: "news", label: "뉴스 수집", component: <NewsPage /> },
];

function App() {
  const [activePage, setActivePage] = useState(pages[0].id);
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [databaseHealth, setDatabaseHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnections() {
      try {
        const [backend, database] = await Promise.all([
          getBackendHealth(),
          getDatabaseHealth(),
        ]);

        setBackendHealth(backend);
        setDatabaseHealth(database);
        setError(null);
      } catch (connectionError) {
        setError(
          connectionError instanceof Error
            ? connectionError.message
            : "연동 상태를 확인하지 못했습니다.",
        );
      }
    }

    void checkConnections();
  }, []);

  const currentPage = pages.find((page) => page.id === activePage) ?? pages[0];

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
        <section className="status-grid" aria-label="연동 상태">
          <StatusCard title="FE-BE 연동" health={backendHealth} error={error} />
          <StatusCard title="BE-DB 연동" health={databaseHealth} error={error} />
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
  error,
}: {
  title: string;
  health: HealthResponse | null;
  error: string | null;
}) {
  const isOnline = health?.status === "ok";

  return (
    <article className={isOnline ? "status-card online" : "status-card"}>
      <strong>{title}</strong>
      <span>{isOnline ? "정상" : "확인 필요"}</span>
      <p>{health?.detail ?? error ?? "백엔드 실행 후 자동 확인됩니다."}</p>
    </article>
  );
}

export default App;
