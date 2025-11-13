cat > README.md << 'EOF'

# Campus Taxi Mini

- Reverse proxy(Nginx) + Frontend(Vite/React) + Auth/Room(Node+Express) + Mongo + Redis
- `docker compose up -d` 만으로 개발 환경 실행

## 🚀 Quick Start

```bash
docker compose up -d
open http://localhost
```

## 개발 루틴: 프론트엔드 + MSW(Mock Service Worker)

이 프로젝트는 `docker compose` 기반으로 동작하며, 프론트엔드 개발 시 실제 백엔드/DB 대신 MSW(Mock Service Worker)를 사용하여 API를 가짜로 응답할 수 있도록 구성되어 있다.

### 1. 전체 구조

- `docker-compose.yml`

  - `frontend` 서비스: Vite + React + TypeScript
  - `auth-service`: 인증 서비스 (Node + Express)
  - `room-service`: 방 관련 서비스 (Node + Express)
  - `mongo`, `redis`, `nginx` 등은 과제 후반부에 실제 연동

- `frontend/public/mockServiceWorker.js`

  - MSW에서 사용하는 서비스 워커 파일 (자동 생성, 수정하지 않음)

- `frontend/src/mocks/handlers.ts`

  - 프론트 개발용 가짜 API 응답 정의
  - 방 목록/방 생성/참여/나가기, 로그인/로그아웃, 마이페이지용 API 등을 포함
  - **로그인 응답에는 토큰이 없고, 단순히 `user` 정보만 반환한다.**
    - 실제 세션/쿠키(`sid`) 처리는 나중에 백엔드에서 구현한다.

- `frontend/src/mocks/browser.ts`

  - 브라우저 환경에서 MSW를 초기화하는 코드

- `frontend/src/main.tsx`
  - 개발 모드 + `VITE_USE_MSW=true` 일 때만 MSW를 활성화하고, 그렇지 않으면 실제 백엔드로 요청을 보냄

### 2. 프론트 개발 플로우 (MSW 사용)

1. 컨테이너 기동

   ```bash
   docker compose up -d
   ```
