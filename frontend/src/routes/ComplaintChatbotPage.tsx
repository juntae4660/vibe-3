import { FormEvent, useEffect, useState } from "react";
import {
  askComplaintBot,
  listComplaintHistory,
  listComplaintManuals,
  uploadComplaintManual,
} from "../api/chatbotApi";
import type { ChatbotAnswer, ChatbotManual } from "../types/chatbot";

const OPENAI_API_KEY_STORAGE_KEY = "public-super-app.openai-api-key";

export function ComplaintChatbotPage() {
  const [manuals, setManuals] = useState<ChatbotManual[]>([]);
  const [history, setHistory] = useState<ChatbotAnswer[]>([]);
  const [selectedManualId, setSelectedManualId] = useState<number | "auto">("auto");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ChatbotAnswer | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState(() => readStoredApiKey());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadInitial();
  }, []);

  useEffect(() => {
    const normalized = apiKey.trim();
    if (normalized) {
      window.localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, normalized);
      return;
    }
    window.localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
  }, [apiKey]);

  async function loadInitial() {
    try {
      setError(null);
      const [manualList, historyList] = await Promise.all([
        listComplaintManuals(),
        listComplaintHistory(),
      ]);
      setManuals(manualList);
      setHistory(historyList);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resolvedApiKey = apiKey.trim();
    if (!resolvedApiKey) {
      setError("OpenAI API 키를 먼저 입력하세요.");
      return;
    }
    if (!uploadFile) {
      setError("업로드할 PDF 파일을 선택하세요.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await uploadComplaintManual(uploadFile, resolvedApiKey);
      setUploadFile(null);
      await loadInitial();
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resolvedApiKey = apiKey.trim();
    const trimmed = question.trim();

    if (!resolvedApiKey) {
      setError("OpenAI API 키를 먼저 입력하세요.");
      return;
    }
    if (!trimmed) {
      setError("질문을 입력하세요.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await askComplaintBot(
        {
          question: trimmed,
          manualId: selectedManualId === "auto" ? null : selectedManualId,
        },
        resolvedApiKey,
      );
      setAnswer(result);
      setQuestion("");
      await loadInitial();
    } catch (askError) {
      setError(getErrorMessage(askError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="chatbot-workspace">
      <section className="schedule-card chatbot-hero">
        <div>
          <p className="eyebrow">RAG Chatbot</p>
          <h3>주요정보통신기반시설 취약점 조치 가이드 챗봇</h3>
          <p>가이드 PDF를 업로드하고, 문서 근거를 바탕으로 질문에 답합니다.</p>
        </div>
        <div className="chatbot-stats">
          <article>
            <strong>{manuals.length}</strong>
            <span>가이드 문서</span>
          </article>
          <article>
            <strong>{history.length}</strong>
            <span>질문 기록</span>
          </article>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="chatbot-grid">
        <section className="schedule-card">
          <div className="section-heading">
            <h4>OpenAI API 키</h4>
            <span>{apiKey.trim() ? "저장됨" : "미입력"}</span>
          </div>
          <div className="api-key-note">
            브라우저 localStorage에만 저장되고, 업로드/질의 요청 때만 백엔드로 전달됩니다.
          </div>
          <input
            className="api-key-input"
            type="password"
            autoComplete="off"
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <div className="form-actions">
            <button type="button" onClick={() => setApiKey("")}>
              키 지우기
            </button>
          </div>
        </section>

        <section className="schedule-card">
          <h4>가이드 PDF 업로드</h4>
          <form className="stack-form" onSubmit={handleUpload}>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
            />
            <div className="form-actions">
              <button type="submit" disabled={isLoading}>
                업로드 및 인덱싱
              </button>
            </div>
          </form>
          <div className="manual-list">
            {manuals.map((manual) => (
              <article className="manual-card" key={manual.id}>
                <strong>{manual.originalFilename}</strong>
                <span>
                  {manual.pageCount}페이지 · {manual.chunkCount}청크
                </span>
              </article>
            ))}
            {manuals.length === 0 ? <p className="empty-state">업로드된 가이드가 없습니다.</p> : null}
          </div>
        </section>
      </div>

      <section className="schedule-card">
        <h4>질문하기</h4>
        <form className="stack-form" onSubmit={handleQuestion}>
          <select
            value={selectedManualId}
            onChange={(event) =>
              setSelectedManualId(event.target.value === "auto" ? "auto" : Number(event.target.value))
            }
          >
            <option value="auto">가장 최근 가이드 자동 사용</option>
            {manuals.map((manual) => (
              <option key={manual.id} value={manual.id}>
                {manual.originalFilename}
              </option>
            ))}
          </select>
          <textarea
            rows={6}
            placeholder="예: 웹 서비스 취약점 조치 시 우선 확인해야 할 항목은?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              답변 받기
            </button>
          </div>
        </form>

        {answer ? (
          <article className="answer-card">
            <strong>답변</strong>
            <p>{answer.answer}</p>
            <div className="source-list">
              {answer.sources.map((source) => (
                <div className="source-card" key={`${source.page}-${source.chunk}`}>
                  <b>Page {source.page}</b>
                  <span>{source.preview}</span>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <section className="schedule-card">
        <div className="section-heading">
          <h4>질문 기록</h4>
          <span>{history.length}건</span>
        </div>
        <div className="history-list">
          {history.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-head">
                <strong>{item.manualFilename || "미지정 문서"}</strong>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              <p className="history-question">{item.question}</p>
              <p className="history-answer">{item.answer}</p>
            </article>
          ))}
          {history.length === 0 ? <p className="empty-state">질문 기록이 없습니다.</p> : null}
        </div>
      </section>
    </div>
  );
}

function readStoredApiKey() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ?? "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";
}
