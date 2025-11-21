# 🚕 Campus Taxi Mini

Reverse proxy(Nginx) + Frontend(Vite/React) + Auth/Room(Node+Express) + MongoDB + Redis로 구성된
**캠퍼스 카풀/택시팟 매칭 미니 서비스**입니다.  
`docker compose up -d` 한 번으로 전체 개발 환경을 올릴 수 있습니다.

---

## 🧱 Tech Stack & 서비스 구성

- **Reverse Proxy**
  - `nginx` (컨테이너명: `taxi-gateway`)
  - 포트: `80 → /api/auth → auth-service`, `/api/rooms → room-service`, `/ → frontend`
- **Frontend**
  - Vite + React + TypeScript
  - Tailwind CSS
- **Backend**
  - `auth-service`: 회원가입/로그인/로그아웃, 내 정보 조회
  - `room-service`: 방 생성/목록 조회/참여/나가기/호스트 정보
  - 모두 Node.js + Express
- **DB & Cache**
  - `mongo`: 사용자/방 정보 영속 저장
  - `redis`: `express-session` 기반 세션 저장소(sid 쿠키로 식별)
- **Infra**
  - Docker Compose로 전체 컨테이너 오케스트레이션

---

## 🚀 Quick Start

### 0. 요구 사항

- Docker
- Docker Compose

### 1. 컨테이너 기동

```bash
docker compose up -d
```

### 2. 서비스 접속

```bash
open http://localhost
```

- / : 프론트엔드(React) 메인 페이지 (방 목록)
- /login : 로그인
- /signup : 회원가입
- /create : 방 생성 페이지
- /mypage : 내 정보 및 내가 만든/참여 중인 방 보기

### 3. 컨테이너 종료

```bash
docker compose down
```

---

## 📦 Docker Hub Images (Single Repository, Multiple Tags)

| Service       | Docker Image Tag                           |
| ------------- | ------------------------------------------ |
| Reverse Proxy | `jeniferkim1673/campus-taxi-mini:gateway`  |
| Frontend      | `jeniferkim1673/campus-taxi-mini:frontend` |
| Auth Service  | `jeniferkim1673/campus-taxi-mini:auth`     |
| Room Service  | `jeniferkim1673/campus-taxi-mini:room`     |

- Repository: https://hub.docker.com/r/jeniferkim1673/campus-taxi-mini

---

### ⚙️ 동작 개요

1. 전체 요청 흐름
   1. 브라우저가 http://localhost로 접속하면 Nginx(reverse-proxy) 가 요청을 수신
   2. 정적 파일 및 프론트엔드는 frontend 컨테이너에서 서빙
   3. 프론트에서 /api/auth/*, /api/rooms/*로 호출하면 Nginx가
   - /api/auth/\_ → auth-service
   - /api/rooms/\_ → room-service
     로 라우팅
   4. auth-service / room-service는
   - MongoDB(mongo)에 영속 데이터(회원정보/방정보/참여정보 등) 저장
   - Redis(redis)에 세션(sid 쿠키 기준) 저장
2. 세션 & 인증 구조
   - 로그인 성공 시 sid 쿠키가 발급되고, 해당 세션은 Redis에 저장
   - 이후 모든 요청에서 sid 쿠키를 참조하여 로그인 상태를 확인
   - 프론트에서는 ProtectedRoute를 통해
   - 로그인 필요 페이지: 방 생성, 마이페이지 등
   - 비로그인 접근 시 /login으로 리다이렉트

---

### 👨‍💻 개발 루틴

**A. Docker 기반 전체 통합 환경**

> 과제 제출 기준 기본 모드

- Nginx + Frontend + auth-service + room-service + Mongo + Redis 전체 기동 - - 프론트에서 API 호출 시 기본 baseURL은 Nginx 기준 /api 사용

```bash
# 전체 기동

docker compose up -d

# 로그 확인 (예시)

docker compose logs -f reverse-proxy
docker compose logs -f auth-service
docker compose logs -f room-service
```

**B. 선택: 프론트엔드 단독 개발용 MSW(Mock Service Worker)**

> 실제 백엔드를 띄우지 않고, 프론트 UI/UX만 빠르게 개발할 때 사용하는 선택 기능입니다.

- frontend/public/mockServiceWorker.js
  - MSW에서 사용하는 서비스 워커 파일 (자동 생성, 수정 X)
- frontend/src/mocks/handlers.ts
  - 프론트 개발용 가짜 API 응답 정의
  - 방 목록/방 생성/참여/나가기, 로그인/로그아웃, 마이페이지용 API 등을 포함
  - 이 모드에서는 로그인 응답에 토큰/세션이 없고, 단순히 user 객체만 반환
- frontend/src/mocks/browser.ts
  - 브라우저 환경에서 MSW 초기화 코드
- frontend/src/main.tsx
  - 개발 모드 + VITE_USE_MSW=true 일 때만 MSW 활성화
  - 그 외에는 실제 백엔드(/api)로 요청을 보냄

**MSW 모드 예시**

```bash
# frontend/.env.development 등에 설정

VITE_USE_MSW=true

# 프론트 단독 실행 (로컬 개발용)

cd frontend
pnpm dev

# 또는 npm run dev
```

> 과제 제출용 Docker 환경에서는 기본적으로 VITE_USE_MSW를 사용하지 않고
> 실제 백엔드(auth/room + Mongo + Redis)로 연동하는 모드를 사용합니다.

---

**📁 주요 디렉터리 구조**
(필요한 부분만 간단히)

```bash
.
├── docker-compose.yml
├── reverse-proxy/
│ └── default.conf # Nginx 라우팅 설정 (/api → backend)
├── auth-service/
│ ├── src/
│ └── Dockerfile
├── room-service/
│ ├── src/
│ └── Dockerfile
├── frontend/
│ ├── src/
│ │ ├── pages/ # RoomListPage, LoginPage, SignupPage, MyPage, CreateRoomPage
│ │ ├── components/ # Navbar, ProtectedRoute 등
│ │ ├── mocks/ # MSW 관련 파일 (선택)
│ │ └── libs/ # axios 인스턴스, queryClient 등
│ └── Dockerfile
└── README.md
```

---

**📌 구현 기능 요약**

- 회원가입 / 로그인 / 로그아웃
- Redis 세션 기반 인증 유지 (sid 쿠키)
- ProtectedRoute로 비로그인 사용자의 보호 페이지 접근 제한
- 방 생성 / 방 목록 조회 / 방 참여 / 방 나가기
- TanStack Query로 목록 조회 + 참여/나가기 시 invalidateQueries
- Navbar에서 로그인/로그아웃/마이페이지 접근
- 전역 Toast 훅(useToast)으로 기본 피드백 제공

**🧪 테스트 팁**

- 새 계정 생성 → 로그인 → 방 생성 → 로그아웃 → 재로그인
  - 세션이 올바르게 유지되는지 / 방 목록/마이페이지에 동일하게 반영되는지 확인
- 두 개의 다른 브라우저/시크릿 모드에서 서로 다른 계정으로 로그인
  - 한 쪽에서 방 생성 후, 다른 계정에서 참여/나가기가 정상 동작하는지 확인
