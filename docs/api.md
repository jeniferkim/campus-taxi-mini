````md
# Campus Taxi Mini – API 명세

본 문서는 Campus Taxi Mini 프로젝트에서 **프론트엔드와 백엔드 간의 통신 규약**을 정의한다.  
현재 프론트엔드와 MSW(Mock Service Worker)에서 사용 중인 API 구조를 기준으로 작성되었으며,  
향후 백엔드 구현 시 이 명세를 기준으로 개발한다.

---

## 1. 공통 규칙

- 모든 API는 `https://{HOST}/api` prefix 아래에 존재한다.
- 요청 / 응답 포맷은 기본적으로 `application/json` 이다.
- 모든 시간 값은 ISO 8601 형식(예: `"2025-11-15T10:00:00.000Z"`)을 사용한다.
- 인증은 최종적으로 세션 기반(`sid` 쿠키)으로 구현 예정이며,  
  현재 프론트 개발 단계에서는 `user` 정보만으로 로그인 상태를 관리한다.

---

## 2. 데이터 타입 정의

### 2.1 User

```ts
type User = {
  _id: string;
  email: string;
  name: string;
};
```
````

### 2.2 Room

프론트엔드 `frontend/src/types/room.ts` 기준.

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

## 3. AUTH SERVICE

### 3.1 회원가입

**POST /api/auth/signup**

회원가입을 수행하고, 생성된 유저 정보를 반환한다.

#### Request Body

```json
{
  "email": "test@example.com",
  "password": "123456",
  "name": "홍길동"
}
```

#### Response

```json
{
  "user": {
    "_id": "me",
    "email": "test@example.com",
    "name": "홍길동"
  }
}
```

#### Status Codes

- `201 Created` : 회원가입 성공
- `400 Bad Request` : 필수 값 누락 또는 유효성 검증 실패
- `409 Conflict` : 이미 존재하는 이메일

---

### 3.2 로그인

**POST /api/auth/login**

이메일/비밀번호로 로그인을 수행하고, 유저 정보를 반환한다.
최종 구현에서는 세션 쿠키를 함께 설정하는 것을 목표로 한다.

#### Request Body

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

#### Response

```json
{
  "user": {
    "_id": "me",
    "email": "test@example.com",
    "name": "홍길동"
  }
}
```

#### Status Codes

- `200 OK` : 로그인 성공
- `400 Bad Request` : 필수 값 누락
- `401 Unauthorized` : 이메일 또는 비밀번호 불일치

---

### 3.3 로그아웃

**POST /api/auth/logout**

로그아웃을 수행한다.
세션 무효화 및 쿠키 삭제는 백엔드에서 처리한다.

#### Request Body

없음

#### Response

```json
{ "success": true }
```

#### Status Codes

- `200 OK` : 로그아웃 성공

---

### 3.4 내 정보 조회

**GET /api/auth/me**

현재 로그인된 유저의 정보를 반환한다.
세션(쿠키)에 저장된 유저 ID를 기반으로 조회한다.

#### Request Body

없음

#### Response

```json
{
  "user": {
    "_id": "me",
    "email": "test@example.com",
    "name": "홍길동"
  }
}
```

#### Status Codes

- `200 OK` : 조회 성공
- `401 Unauthorized` : 로그인 상태가 아님

---

## 4. ROOM SERVICE

### 4.1 방 목록 조회

**GET /api/rooms**

택시 방 목록을 조회한다.
출발지/도착지 검색 또는 특정 참가자 기준 필터링이 가능하다.

#### Query Parameters

| Key         | Type   | 필수 | 설명                                                               |
| ----------- | ------ | ---- | ------------------------------------------------------------------ |
| departure   | string | ✕    | 출발지 검색(부분 일치)                                             |
| destination | string | ✕    | 도착지 검색(부분 일치)                                             |
| participant | string | ✕    | 해당 유저가 **호스트이거나 참가자인 방만** 조회                    |
| \_ts        | number | ✕    | 캐시 방지용 타임스탬프(프론트에서만 사용, 서버 로직에는 영향 없음) |

#### Request Body

없음

#### Response

```json
{
  "rooms": [
    {
      "_id": "1",
      "title": "카이스트 → 대전역",
      "departure": "카이스트",
      "destination": "대전역",
      "departureTime": "2025-11-15T10:00:00.000Z",
      "maxPassenger": 4,
      "participants": ["user1"],
      "hostId": "user1"
    }
  ]
}
```

#### Status Codes

- `200 OK` : 조회 성공

---

### 4.2 방 상세 조회

**GET /api/rooms/:id**

특정 방의 상세 정보를 조회한다.

#### Path Parameters

| Key | Type   | 설명          |
| --- | ------ | ------------- |
| id  | string | Room `_id` 값 |

#### Request Body

없음

#### Response

```json
{
  "_id": "1",
  "title": "카이스트 → 대전역",
  "departure": "카이스트",
  "destination": "대전역",
  "departureTime": "2025-11-15T10:00:00.000Z",
  "maxPassenger": 4,
  "participants": ["user1"],
  "hostId": "user1"
}
```

#### Status Codes

- `200 OK` : 조회 성공
- `404 Not Found` : 해당 ID의 방이 존재하지 않음

---

### 4.3 방 생성

**POST /api/rooms**

새로운 택시 방을 생성한다.
생성한 유저는 자동으로 해당 방의 호스트가 되며, 참가자 목록에 포함된다.

#### Request Body

```json
{
  "title": "카이스트 → 유성온천",
  "departure": "카이스트",
  "destination": "유성온천",
  "departureTime": "2025-11-30T18:00:00.000Z",
  "maxPassenger": 3
}
```

#### Response

```json
{
  "_id": "1736846951450",
  "title": "카이스트 → 유성온천",
  "departure": "카이스트",
  "destination": "유성온천",
  "departureTime": "2025-11-30T18:00:00.000Z",
  "maxPassenger": 3,
  "participants": ["me"],
  "hostId": "me"
}
```

#### Status Codes

- `201 Created` : 생성 성공
- `400 Bad Request` : 필수 값 누락 또는 유효성 검증 실패
- `401 Unauthorized` : 로그인 필요

---

### 4.4 방 참여

**POST /api/rooms/:id/join**

해당 방에 현재 로그인된 유저를 참가자로 추가한다.

#### Path Parameters

| Key | Type   | 설명          |
| --- | ------ | ------------- |
| id  | string | Room `_id` 값 |

#### Request Body

없음 (로그인된 유저 정보는 세션/쿠키에서 읽어온다고 가정)

#### Response

```json
{
  "_id": "1",
  "title": "카이스트 → 대전역",
  "departure": "카이스트",
  "destination": "대전역",
  "departureTime": "2025-11-15T10:00:00.000Z",
  "maxPassenger": 4,
  "participants": ["user1", "me"],
  "hostId": "user1"
}
```

#### Status Codes

- `200 OK` : 참여 성공
- `400 Bad Request` : 이미 참여 중인 유저
- `401 Unauthorized` : 로그인 필요
- `404 Not Found` : 해당 방이 없음

---

### 4.5 방 나가기

**POST /api/rooms/:id/leave**

해당 방에서 현재 로그인된 유저를 참가자 목록에서 제거한다.

#### Path Parameters

| Key | Type   | 설명          |
| --- | ------ | ------------- |
| id  | string | Room `_id` 값 |

#### Request Body

없음

#### Response

```json
{
  "_id": "1",
  "title": "카이스트 → 대전역",
  "departure": "카이스트",
  "destination": "대전역",
  "departureTime": "2025-11-15T10:00:00.000Z",
  "maxPassenger": 4,
  "participants": ["user1"],
  "hostId": "user1"
}
```

#### Status Codes

- `200 OK` : 나가기 성공
- `401 Unauthorized` : 로그인 필요
- `404 Not Found` : 해당 방이 없음

---

## 5. 구현 우선순위 가이드

1. **프론트/ MSW와 100% 동일한 동작을 하는 백엔드 구현**

   - 위 명세의 URL/메서드/요청/응답 구조를 그대로 따른다.

2. 초기 단계에서는 **메모리 배열 기반(room-service, auth-service)** 으로 구현 가능
3. 이후 단계에서 MongoDB/Redis를 붙여도,
   **위 API 명세는 변경하지 않는 것을 목표**로 한다. (내부 구현만 교체)

```

```
