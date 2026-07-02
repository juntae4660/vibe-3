from __future__ import annotations

import json
import os
import shutil
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import MANUALS_DIR, UPLOADS_DIR, VECTORSTORE_DIR
from app.core.database import get_connection, initialize_database
from app.repositories import chatbot_repository
from app.schemas.chatbot import ChatQuestionRequest

OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
RETRIEVAL_K = 4


def list_manuals() -> list[dict]:
    initialize_database()
    with get_connection() as connection:
        return chatbot_repository.list_manuals(connection)


def upload_manual(file: UploadFile, api_key: str | None) -> dict:
    initialize_database()
    resolved_api_key = _resolve_api_key(api_key)
    _ensure_pdf(file)
    MANUALS_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)

    original_name = file.filename or "manual.pdf"
    safe_name = f"{uuid.uuid4().hex}.pdf"
    stored_path = MANUALS_DIR / safe_name
    upload_path = UPLOADS_DIR / safe_name
    vectorstore_path = VECTORSTORE_DIR / safe_name.removesuffix(".pdf")

    try:
        data = file.file.read()
        stored_path.write_bytes(data)
        upload_path.write_bytes(data)

        loader = PyPDFLoader(str(stored_path))
        documents = loader.load()
        if not documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF에서 텍스트를 추출할 수 없습니다.",
            )

        splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=180)
        chunks = splitter.split_documents(documents)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="문서를 분할할 수 없습니다.",
            )

        for index, chunk in enumerate(chunks):
            chunk.metadata["chunk"] = index
            chunk.metadata["manual_filename"] = original_name

        embeddings = _get_embeddings(resolved_api_key)
        Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=str(vectorstore_path),
            collection_name=safe_name.removesuffix(".pdf"),
        )

        with get_connection() as connection:
            manual = chatbot_repository.create_manual(
                connection,
                {
                    "filename": safe_name,
                    "original_filename": original_name,
                    "stored_path": str(stored_path),
                    "vectorstore_path": str(vectorstore_path),
                    "page_count": len(documents),
                    "chunk_count": len(chunks),
                },
            )

        return manual
    except Exception:
        _cleanup_paths(stored_path, upload_path, vectorstore_path)
        raise


def answer_question(payload: ChatQuestionRequest, api_key: str | None) -> dict:
    initialize_database()
    resolved_api_key = _resolve_api_key(api_key)
    question = payload.question.strip()
    manual = _resolve_manual(payload.manual_id)
    retriever = _load_retriever(manual["vectorstore_path"], resolved_api_key)
    docs = retriever.invoke(question)

    if not docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="질문과 관련된 내용을 찾지 못했습니다. 다른 표현으로 다시 질문해 주세요.",
        )

    answer_text, sources = _generate_answer(
        question=question,
        docs=docs,
        manual_name=manual["original_filename"],
        api_key=resolved_api_key,
    )

    with get_connection() as connection:
        saved = chatbot_repository.create_chat_response(
            connection,
            {
                "manual_id": manual["id"],
                "question_text": question,
                "response_text": answer_text,
                "sources_json": json.dumps(sources, ensure_ascii=False),
            },
        )

    return _to_chat_response(saved, sources)


def list_history(limit: int = 20) -> list[dict]:
    initialize_database()
    with get_connection() as connection:
        rows = chatbot_repository.list_chat_history(connection, limit=limit)
    return [
        {
            "id": row["id"],
            "manualId": row["manual_id"],
            "manualFilename": row.get("manual_filename"),
            "question": row["question_text"],
            "answer": row["response_text"],
            "sources": json.loads(row["sources_json"] or "[]"),
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def _load_retriever(vectorstore_path: str, api_key: str):
    embeddings = _get_embeddings(api_key)
    vectorstore = Chroma(
        collection_name=Path(vectorstore_path).name,
        persist_directory=vectorstore_path,
        embedding_function=embeddings,
    )
    return vectorstore.as_retriever(search_kwargs={"k": RETRIEVAL_K})


def _generate_answer(
    question: str,
    docs: list[Document],
    manual_name: str,
    api_key: str,
) -> tuple[str, list[dict]]:
    context_blocks: list[str] = []
    sources: list[dict] = []

    for doc in docs:
        page_number = int(doc.metadata.get("page", 0)) + 1
        chunk_index = int(doc.metadata.get("chunk", 0))
        preview = _clean_text(doc.page_content)[:240]
        context_blocks.append(
            f"[page {page_number}, chunk {chunk_index}]\n{_clean_text(doc.page_content)}"
        )
        sources.append(
            {
                "page": page_number,
                "chunk": chunk_index,
                "preview": preview,
            }
        )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "너는 주요정보통신기반시설 취약점 조치 가이드 전용 상담 챗봇이다. "
                "반드시 제공된 문서 조각에 근거해서 답변하고, 근거가 부족하면 부족하다고 말한다. "
                "답변은 한국어로 쓰고, 단계별 조치와 주의사항을 분리해서 설명한다.",
            ),
            (
                "user",
                "문서명: {manual_name}\n\n질문: {question}\n\n근거 문서:\n{context}\n\n"
                "답변 규칙:\n- 가능한 한 짧고 명확하게 답변\n- 조치 순서를 번호로 정리\n- 문서에 없는 내용은 추측하지 말 것",
            ),
        ]
    )

    model = ChatOpenAI(model=OPENAI_CHAT_MODEL, temperature=0, api_key=api_key)
    chain = prompt | model
    response = chain.invoke(
        {
            "manual_name": manual_name,
            "question": question,
            "context": "\n\n".join(context_blocks),
        }
    )
    answer = _clean_text(getattr(response, "content", str(response)))
    return answer, sources


def _resolve_manual(manual_id: int | None) -> dict:
    with get_connection() as connection:
        if manual_id is not None:
            manual = chatbot_repository.get_manual(connection, manual_id)
            if manual is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="지정한 가이드 문서를 찾을 수 없습니다.",
                )
            return manual

        manuals = chatbot_repository.list_manuals(connection)
        if not manuals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="먼저 PDF 가이드 문서를 업로드해야 합니다.",
            )
        return manuals[0]


def _get_embeddings(api_key: str) -> OpenAIEmbeddings:
    return OpenAIEmbeddings(model=OPENAI_EMBEDDING_MODEL, api_key=api_key)


def _ensure_pdf(file: UploadFile) -> None:
    filename = (file.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF 파일만 업로드할 수 있습니다.",
        )


def _cleanup_paths(*paths: Path) -> None:
    for path in paths:
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        elif path.exists():
            path.unlink(missing_ok=True)


def _clean_text(text: str) -> str:
    return " ".join(text.split())


def _resolve_api_key(api_key: str | None) -> str:
    resolved = (api_key or os.getenv("OPENAI_API_KEY") or "").strip()
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OpenAI API 키를 입력하세요.",
        )
    return resolved


def _to_chat_response(saved_row: dict, sources: list[dict]) -> dict:
    return {
        "id": saved_row["id"],
        "manualId": saved_row["manual_id"],
        "question": saved_row["question_text"],
        "answer": saved_row["response_text"],
        "sources": sources,
        "createdAt": saved_row["created_at"],
        "manualFilename": saved_row.get("manual_filename"),
    }
