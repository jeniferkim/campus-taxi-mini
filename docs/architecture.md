# Campus Taxi Mini – Architecture Overview

본 문서는 Campus Taxi Mini 프로젝트의 **전체 시스템 구조**를 설명한다.  
프론트엔드, 백엔드, 인증, 데이터 저장소, 프록시 계층까지 모든 흐름을 포함한다.

---

# 1. 전체 구조도

```
┌─────────────────────────────┐
│         Frontend (Vite)     │
│ React + TanStack Query      │
│ http://localhost            │
└───────────────┬─────────────┘
                │ API 요청
                ▼
┌─────────────────────────────┐
│      reverse-proxy (Nginx)  │
│  /api/auth   → auth-service │
│  /api/rooms  → room-service │
└───────────────┬─────────────┘
        ┌───────┴────────┬─────────┐
        ▼                 ▼         ▼
┌──────────────┐  ┌─────────────┐ ┌───────────┐
│ auth-service │  │ room-service│ │   MongoDB  │
│ 로그인/회원가입│ │ 방 목록/생성  │ │  유저/방   │
│ Redis 세션    │ │ 참여/나가기  │ │   저장     │
└───────┬────────┘  └─────────────┘ └────┬──────┘
        │ 세션 쿠키                     │
        ▼                                ▼
┌──────────────┐                 ┌──────────────┐
│    Redis     │                 │    MongoDB    │
│  세션 저장소 │                 │    rooms DB    │
└──────────────┘                 └──────────────┘
```

---

# 2. 구성 요소 상세 설명

## 2.1 Frontend (React)

- Vite 기반 React SPA
- TanStack Query로 API 상태 관리
- axiosInstance에서 모든 요청을 `/api/*`로 전송
- 실제 호출 흐름은 다음과 같다:

```
Frontend → /api/... → reverse-proxy → auth/room-service
```

---

## 2.2 reverse-proxy (Nginx)

- 프론트와 백엔드 사이의 **중간 API 게이트웨이**
- 주요 라우팅 규칙:

| 경로         | 실제 서비스       |
| ------------ | ----------------- |
| `/api/auth`  | auth-service:8080 |
| `/api/rooms` | room-service:8081 |

- 동일한 도메인에서 쿠키(`sid`)를 주고받기 위한 필수 구성 요소

---

## 2.3 auth-service

- Node.js(Express)
- 역할:
  - 회원가입
  - 로그인
  - 세션 발급 (Redis에 저장)
  - `/api/auth/me`로 로그인 유저 정보 조회
- Redis 사용 이유:
  - 세션을 **stateless 쿠키**로 관리하지 않고,
  - 중앙 세션 저장소에서 유지할 수 있기 때문

---

## 2.4 room-service

- Node.js(Express)
- 역할:
  - 방 목록 조회
  - 방 상세 조회
  - 방 생성
  - 방 참여/나가기
- 초기 버전은 **메모리 배열 기반 DB**
- 이후 단계에서 MongoDB로 교체 가능 (API 형식 동일 유지)

---

## 2.5 Redis

- key-value 기반 세션 저장소
- auth-service가 로그인 시:

```
sid → { userId, name }
```

형태로 저장

---

## 2.6 MongoDB

- 유저, 방 데이터를 저장하는 실제 DB
- room-service가 필요에 따라 연결하여 데이터를 영속적으로 저장

---

# 3. 전체 요청 흐름 요약

## 3.1 로그인

1. Frontend → POST `/api/auth/login`
2. reverse-proxy → auth-service
3. auth-service → Redis에 세션 저장
4. auth-service → `Set-Cookie: sid=...`
5. Frontend는 자동 로그인 상태 유지

---

## 3.2 방 목록 조회

1. Frontend → GET `/api/rooms?departure=...`
2. reverse-proxy → room-service
3. room-service → 필터링 결과 반환
4. Frontend에서 목록 렌더링

---

## 3.3 방 생성

1. Frontend → POST `/api/rooms`
2. reverse-proxy → room-service
3. room-service → 방 생성 후 `hostId = userId`
4. Frontend → invalidateQueries → 목록 갱신

---

## 3.4 방 참여 / 나가기

- 참여: `POST /api/rooms/:id/join`
- 나가기: `POST /api/rooms/:id/leave`

room-service가 participants 배열을 업데이트하고, 프론트는 즉시 목록을 새로고침.

---

# 4. 개발 시 원칙

1. **API 명세(api.md)와 응답 구조는 백/프론트/MSW가 모두 동일해야 한다.**
2. 인프라(Nginx, Docker, 세션) 수정하더라도 API 형태는 변경하지 않는다.
3. 프론트는 TanStack Query로 **요청–캐싱–동기화**를 안정적으로 유지한다.

---

# 5. 파일 구조 예시

```
project/
│
├── frontend/
├── auth-service/
├── room-service/
├── reverse-proxy/
├── docs/
│   ├── api.md
│   └── architecture.md
└── docker-compose.yml
```

---

# 6. 마무리

이 아키텍처 문서는 Campus Taxi Mini의 코드 유지보수, 백엔드 확장(MongoDB/Redis),  
테스트/디버깅, 과제 제출 등에 표준 기준 역할을 한다.
