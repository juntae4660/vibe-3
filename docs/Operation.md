# 공공직군 행정업무 슈퍼앱 Operation

## 1. 문서 목적

본 문서는 공공직군 행정업무 슈퍼앱의 로컬 개발 실행 방법, 운영 절차, 자주 발생하는 오류와 대응 방법을 정리한다. 현재 단계는 개발환경 구성 및 문서화 단계이며, 실제 애플리케이션 코드는 이후 작성 예정이다.

## 2. 현재 설치 상태

### 2.1 Frontend

위치: `frontend/`

설치된 주요 모듈:

- `react`
- `react-dom`
- `vite`
- `typescript`
- `@vitejs/plugin-react`
- `@types/react`
- `@types/react-dom`

확인 명령:

```powershell
cd frontend
npm.cmd list --depth=0
```

### 2.2 Backend

위치: `backend/`

설치된 주요 모듈:

- `fastapi`
- `pydantic`
- `starlette`
- `anyio`

생성된 구성:

- `.venv/`
- `pyproject.toml`
- `uv.lock`

확인 명령:

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv run python -c "import fastapi; print(fastapi.__version__)"
```

### 2.3 Database

초기 DB는 SQLite를 사용한다.

- `sqlite3` CLI는 현재 PATH에서 확인되지 않았다.
- Python 표준 라이브러리 `sqlite3`는 사용 가능하다.
- 확인된 SQLite 라이브러리 버전은 `3.53.1`이다.

확인 명령:

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv run python -c "import sqlite3; print(sqlite3.sqlite_version)"
```

## 3. 실행 방법

현재는 실제 애플리케이션 코드가 없으므로 실행 가능한 FE/BE 앱은 아직 없다. 아래 명령은 코드 작성 이후 사용할 기준 명령이다.

### 3.1 Frontend 실행 예정 명령

```powershell
cd frontend
npm.cmd run dev
```

필요한 스크립트 예시:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

### 3.2 Backend 실행 예정 명령

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv run fastapi dev app/main.py
```

또는 `uvicorn`을 별도로 설치한 경우:

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv run uvicorn app.main:app --reload
```

## 4. 의존성 관리

### 4.1 Frontend 패키지 추가

```powershell
cd frontend
npm.cmd install 패키지명
```

개발 의존성 추가:

```powershell
cd frontend
npm.cmd install -D 패키지명
```

### 4.2 Backend 패키지 추가

uv 기본 캐시 경로 접근 문제가 발생할 수 있으므로, 현재 프로젝트에서는 `UV_CACHE_DIR` 지정 후 실행하는 방식을 권장한다.

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv add 패키지명
```

개발 의존성 그룹 추가 예시:

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv add --dev pytest
```

## 5. 자주 발생하는 오류와 대응

### 5.1 PowerShell에서 npm 실행 정책 오류

증상:

```text
npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

원인:

PowerShell 실행 정책 때문에 `npm.ps1` 실행이 차단된다.

대응:

```powershell
npm.cmd --version
npm.cmd install
npm.cmd run dev
```

현재 환경에서는 `npm` 대신 `npm.cmd` 사용을 권장한다.

### 5.2 uv 캐시 접근 권한 오류

증상:

```text
Failed to initialize cache at C:\Users\admin\AppData\Local\uv\cache
액세스가 거부되었습니다.
```

원인:

uv 기본 캐시 디렉터리에 접근 권한 문제가 있다.

대응:

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv run python --version
```

작업마다 `UV_CACHE_DIR=.uv-cache`를 지정하거나, 사용자 환경변수로 설정한다.

### 5.3 python 명령을 찾을 수 없음

증상:

```text
Python was not found but can be installed from the Microsoft Store
```

원인:

시스템 PATH에 Python 실행 파일이 등록되어 있지 않다.

대응:

Python은 uv가 관리하는 버전을 사용한다.

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv run python --version
```

### 5.4 sqlite3 명령을 찾을 수 없음

증상:

```text
sqlite3 : The term 'sqlite3' is not recognized
```

원인:

SQLite CLI가 설치되어 있지 않거나 PATH에 없다.

대응:

MVP 개발에서는 Python 내장 `sqlite3` 사용이 가능하다.

```powershell
cd backend
$env:UV_CACHE_DIR='.uv-cache'
uv run python -c "import sqlite3; print(sqlite3.sqlite_version)"
```

SQLite DB를 직접 열어 확인해야 하는 경우 DB Browser for SQLite 같은 별도 도구 사용을 고려한다.

### 5.5 패키지 다운로드 실패

증상:

```text
Failed to fetch
request to registry.npmjs.org failed
request to pypi.org failed
```

원인:

네트워크 제한, 프록시, 방화벽, 패키지 저장소 접근 제한 문제일 수 있다.

대응:

- 네트워크 연결 상태를 확인한다.
- 회사/기관망에서는 프록시 설정을 확인한다.
- npm registry와 PyPI 접근 권한을 확인한다.
- 필요한 경우 관리자 권한 또는 승인된 네트워크에서 설치한다.

## 6. 운영 정책 초안

### 6.1 파일 업로드 정책

- 엑셀 파일은 `.xlsx`를 우선 지원한다.
- 업로드 파일은 작업 완료 후 자동 삭제한다.
- 민감정보가 포함된 파일은 로그에 원문을 남기지 않는다.
- 다운로드 결과물도 일정 기간 후 삭제한다.

### 6.2 민원 챗봇 운영 정책

- 챗봇 답변은 최종 답변이 아니라 초안으로 취급한다.
- 답변에는 참고한 매뉴얼 항목을 함께 표시한다.
- 근거가 부족한 답변은 "담당자 확인 필요"로 표시한다.
- 민원인의 개인정보를 외부 서비스에 전송하지 않는 구성을 우선한다.

### 6.3 뉴스 수집 운영 정책

- 공개 RSS 또는 공식 API 사용을 우선한다.
- 기사 전문을 저장하지 않고 제목, URL, 출처, 발행일 중심으로 저장한다.
- 중복 기사는 URL과 제목 기준으로 제거한다.
- 수집 실패 시 이전 수집 결과를 유지하고 오류 로그를 남긴다.

### 6.4 백업 정책

- SQLite DB 파일은 정기 백업 대상이다.
- 운영 단계에서는 매일 1회 이상 백업을 권장한다.
- 업로드 임시 파일은 백업 대상에서 제외한다.
- 매뉴얼 원본 파일은 버전 관리 또는 별도 백업 대상으로 둔다.

## 7. 사용자 사용법 초안

### 7.1 팀원 스케줄 관리

1. 캘린더 화면에 접속한다.
2. 등록할 날짜를 선택한다.
3. 일정 유형, 제목, 담당자, 시작/종료일시를 입력한다.
4. 저장 후 캘린더에서 색상별 일정을 확인한다.

### 7.2 엑셀 파일 분리

1. 엑셀 자동화 화면에 접속한다.
2. `.xlsx` 파일을 업로드한다.
3. 시스템이 인식한 컬럼 목록을 확인한다.
4. 분리 기준 컬럼을 선택한다.
5. 실행 후 결과 파일을 다운로드한다.

### 7.3 엑셀 파일 병합

1. 병합할 엑셀 파일 여러 개를 업로드한다.
2. 병합 기준을 확인한다.
3. 실행 후 통합 엑셀 파일을 다운로드한다.

### 7.4 민원 대응 챗봇

1. 민원 매뉴얼을 업로드한다.
2. 민원 내용을 입력한다.
3. 대응 방향과 답변 초안을 확인한다.
4. 참고 근거와 주의사항을 검토한다.
5. 담당자가 최종 답변을 확정한다.

### 7.5 뉴스 기사 확인

1. 뉴스 화면에 접속한다.
2. 수집 일자와 키워드를 선택한다.
3. 기사 제목, 출처, 링크를 확인한다.
4. 필요한 기사는 원문 링크로 이동한다.

## 8. 향후 운영 개선 항목

- 사용자 인증과 권한 관리
- DB 마이그레이션 자동화
- 엑셀 작업 비동기 큐 도입
- 뉴스 수집 스케줄러 도입
- 민원 매뉴얼 버전 관리
- 운영 로그와 감사 로그 분리
- Docker 기반 실행환경 표준화
