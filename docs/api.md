# Campus Taxi Mini – API 명세

본 문서는 Campus Taxi Mini 프로젝트에서 **프론트엔드 ↔ 백엔드 간 통신 규약**을 정리한 문서이다.  
현재 실제 서비스는 다음 구성요소로 이루어져 있다:

- **auth-service** : 회원가입, 로그인, 세션 발급
- **room-service** : 방 목록/생성/참여/나가기
- **reverse-proxy(nginx)** : `/api/auth`, `/api/rooms` 라우팅
- **frontend** : React + TanStack Query 기반 SPA

이 명세는 **프론트엔드, 백엔드, MSW(Mock) 모두가 동일하게 따르는 규칙**이다.

---

# 1. 공통 규칙

- 모든 API는 `/api` prefix 아래 존재한다.
  - 예: `/api/auth/login`, `/api/rooms?departure=...`
- 요청/응답 포맷: `application/json`
- 날짜/시간: **ISO 8601 문자열**
- 인증 방식:
  - **세션 쿠키(`sid`) 기반**
  - 로그인 후 백엔드가 `sid`를 쿠키로 내려주며, 프론트는 자동으로 유지됨.
  - 모든 인증 필요한 API는 쿠키로 인증

---

# 2. 데이터 타입 정의

## 2.1 User

```ts
type User = {
  _id: string;
  email: string;
  name: string;
};
```

## 2.2 Room

프론트엔드 `/src/types/room.ts` 기준.

```ts
export type Room = {
  _id: string;
  title: string;
  departure: string;
  destination: string;
  departureTime: string; // ISO string
  maxPassenger: number;
  participants?: Array<string | { _id: string }>;
  hostId?: string | { _id: string };
};
```

---

# 3. AUTH SERVICE

## 3.1 회원가입

**POST /api/auth/signup**

회원가입 후, 즉시 로그인된 상태로 세션 쿠키(`sid`)가 발급된다.

### Request Body

```json
{
  "email": "test@example.com",
  "password": "123456",
  "name": "홍길동"
}
```

### Response

```json
{
  "_id": "u123",
  "email": "test@example.com",
  "name": "홍길동"
}
```

### Status Codes

- `201 Created` : 성공
- `400 Bad Request` : 필수값 누락
- `409 Conflict` : 이미 존재하는 이메일

---

## 3.2 로그인

**POST /api/auth/login**

### Request Body

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

### Response

```json
{
  "_id": "u123",
  "email": "test@example.com",
  "name": "홍길동"
}
```

### Status Codes

- `200 OK` : 성공
- `401 Unauthorized` : 정보 불일치

---

## 3.3 내 정보 조회

**GET /api/auth/me**

세션 쿠키(`sid`)로 현재 로그인 유저 정보를 조회.

### Response

```json
{
  "userId": "u123",
  "name": "홍길동"
}
```

### Status Codes

- `200 OK`
- `401 Unauthorized`

---

## 3.4 로그아웃

**POST /api/auth/logout**

세션 삭제 후 쿠키 제거.

### Response

```json
{ "ok": true }
```

### Status Codes

- `200 OK`

---

# 4. ROOM SERVICE

## 4.1 방 목록 조회

**GET /api/rooms**

### Query Parameters

| Key         | Type   | 설명                                            |
| ----------- | ------ | ----------------------------------------------- |
| departure   | string | 출발지 부분검색                                 |
| destination | string | 도착지 부분검색                                 |
| participant | string | 이 유저가 만든/참여 중인 방만 필터링            |
| \_ts        | number | 캐시 방지용 (프론트용), 서버 로직에는 영향 없음 |

### Response

```json
{
  "rooms": [
    {
      "_id": "r1",
      "title": "카이스트 → 대전역",
      "departure": "카이스트",
      "destination": "대전역",
      "departureTime": "2025-11-19T10:00:00.000Z",
      "maxPassenger": 4,
      "participants": ["u123"],
      "hostId": "u123"
    }
  ]
}
```

### Status Codes

- `200 OK`

---

## 4.2 방 상세 조회

**GET /api/rooms/:id**

### Response

```json
{
  "_id": "r1",
  "title": "카이스트 → 대전역",
  "departure": "카이스트",
  "destination": "대전역",
  "departureTime": "2025-11-19T10:00:00.000Z",
  "maxPassenger": 4,
  "participants": ["u123"],
  "hostId": "u123"
}
```

### Status Codes

- `200 OK`
- `404 Not Found`

---

## 4.3 방 생성

**POST /api/rooms**

### Request Body

```json
{
  "title": "집 가자",
  "departure": "가천대역",
  "destination": "수지구청역",
  "departureTime": "2025-11-27T14:00:00.000Z",
  "maxPassenger": 3
}
```

### Response

```json
{
  "_id": "r17293",
  "title": "집 가자",
  "departure": "가천대역",
  "destination": "수지구청역",
  "departureTime": "2025-11-27T14:00:00.000Z",
  "maxPassenger": 3,
  "hostId": "u123",
  "participants": ["u123"]
}
```

### Status Codes

- `201 Created`
- `401 Unauthorized`

---

## 4.4 방 참여

**POST /api/rooms/:id/join**

### Response

```json
{
  "_id": "r1",
  "participants": ["u123", "u555"]
}
```

### Status Codes

- `200 OK`
- `404 Not Found`

---

## 4.5 방 나가기

**POST /api/rooms/:id/leave**

### Response

```json
{
  "_id": "r1",
  "participants": ["u555"]
}
```

### Status Codes

- `200 OK`
- `404 Not Found`

---

# 5. 구현 우선순위

1. 프론트–백–MSW 세 곳 모두 **이 문서에 정의된 API 구조를 100% 동일하게 유지**
2. room-service는 초기엔 **메모리 DB**, 이후 MongoDB 연동
3. auth-service는 Redis 기반 세션 사용
