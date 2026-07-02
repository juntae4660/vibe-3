# 코드 테스트 리포트

## 검사 개요

- 대상: FE(React + TypeScript + Vite), BE(Python + FastAPI), SQLite 연동
- 목적: 정상 작동 여부와 기본 보안 취약성 점검
- 실행일: 2026-07-01

## 실행 결과

| 우선순위 | 영역 | 파일/위치 | 점검 항목 | 결과 | 권장 조치 |
| --- | --- | --- | --- | --- | --- |
| 양호 | FE | `frontend/package.json` | 빌드 가능 여부 | `npm.cmd run build` 성공 | 추가 UI 변경 시 동일 명령으로 회귀 확인 |
| 양호 | BE | `backend/app/main.py` | 앱 import 및 startup 경로 | `uv run python -c "from app.main import app"` 성공 | startup 시 DB 초기화 유지 |
| 양호 | BE/DB | `backend/app/main.py`, `backend/app/core/database.py` | 런타임 health API | `/api/health`, `/api/db/health` 정상 응답 확인 | 운영용 모니터링으로 확장 가능 |
| 중간 | 보안/구조 | `backend/app/api/routes/calendar.py:16-66`, `backend/app/main.py:17-22` | 인증/인가 부재 | 일정/팀원 생성, 수정, 삭제 API가 인증 없이 노출됨 | 세션/토큰 기반 인증과 권한 검증 추가 |
| 중간 | DB 무결성 | `backend/app/core/database.py:7-11, 50-62` | SQLite 외래키 강제 여부 | FK는 선언됐지만 `PRAGMA foreign_keys=ON`이 없어 강제되지 않음 | 연결 시 외래키 활성화 설정 추가 |

## 보안 점검 메모

- CORS는 개발용 로컬 주소만 허용하고 있어 범위는 과도하지 않음.
- SQL 접근은 현재 확인된 범위에서 파라미터 바인딩 패턴을 사용하고 있음.
- 다만 인증/인가가 없어 내부 도구 수준을 넘는 배포에는 위험하다.
- 파일 업로드 기능은 이번 대상 범위에 없어서 별도 취약점은 확인하지 못했다.

## 요약

FE 빌드와 BE 기동, DB health 응답은 정상이었다.  
현재 가장 큰 리스크는 인증/인가가 전혀 없어 일정/팀원 변경 API가 그대로 노출된다는 점이다.  
SQLite는 외래키를 선언했지만 실제 강제가 빠져 있어 데이터 무결성 보완이 필요하다.

## 미검증 항목

- FE 단위 테스트 스크립트가 없어 자동 테스트는 빌드 위주로만 확인함
- BE `pytest` 스위트가 없어 단위/통합 테스트는 별도 실행하지 못함
- 브라우저 기반 UI 회귀 테스트는 수행하지 않음

## 권장 조치

1. BE에 인증/인가를 추가하고 쓰기 API를 보호한다.
2. SQLite 연결 시 `PRAGMA foreign_keys=ON`을 적용한다.
3. FE와 BE에 테스트 스크립트를 추가해 자동 점검 범위를 넓힌다.
