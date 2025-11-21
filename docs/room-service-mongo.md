# Campus Taxi Mini – room-service MongoDB 마이그레이션 가이드

이 문서는 `room-service`를 현재의 **메모리 배열 기반 구현**에서  
실제 **MongoDB 기반 구현**으로 교체하는 2단계 작업 계획을 정리한 것이다.

최종 목표:

- `/api/rooms` 관련 모든 API가 **MongoDB 컬렉션**을 읽고 쓰도록 변경
- 프론트엔드와 `docs/api.md` 명세는 **변경 없이 그대로 유지**
- 이후 단계에서 **세션 기반 userId**를 연동하기 쉽게 구조를 만들어 둠

---

## 1. 현재 room-service 구조 요약

```text
room-service/
  src/
    index.ts          # Express 앱 생성, /api/rooms 라우터 마운트
    routes/
      rooms.ts        # 현재: in-memory rooms 배열을 사용하는 핸들러
    data/
      rooms.db.ts     # 초기 더미 방 목록이 들어있는 배열
```

현재 `routes/rooms.ts` 의 핵심 포인트:

- 상단에서 `rooms` 배열을 import 해서 직접 수정/조회
- `GET /api/rooms` → 배열 필터링 후 `{ rooms: [...] }` 응답
- `POST /api/rooms` → `rooms.push(newRoom)`
- `POST /api/rooms/:id/join / leave` → 배열 요소 수정

---

## 2. MongoDB 마이그레이션 전체 단계

1. **MongoDB 연결 설정 파일 추가** (`src/db/mongo.ts`)
2. **Room 스키마 & 모델 정의** (`src/models/Room.ts`)
3. **rooms 라우터를 Mongo 버전으로 교체** (`src/routes/rooms.ts`)
4. **index.ts에서 Mongo 연결 보장 후 서버 기동**
5. (선택) **세션 기반 userId 연동 준비**

아래 단계들을 순서대로 적용하면 된다.

---

## 3. 1단계 – MongoDB 연결 설정 (`src/db/mongo.ts`)

먼저 room-service에서 사용할 Mongo 연결 모듈을 만든다.  
(room-service는 auth-service와 독립적으로 Mongo를 써도 괜찮다.)

```ts
// room-service/src/db/mongo.ts
import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/campus_taxi";

export async function connectMongo() {
  await mongoose.connect(MONGO_URL);
  console.log("[room-service] Mongo connected:", MONGO_URL);
}
```

### 필요한 패키지

`room-service` 디렉터리 기준:

```bash
pnpm add mongoose
pnpm add -D @types/mongoose
```

---

## 4. 2단계 – Room 스키마 & 모델 정의 (`src/models/Room.ts`)

프론트 타입(`Room`)과 `docs/api.md`를 기준으로 스키마를 정의한다.

```ts
// room-service/src/models/Room.ts
import { Schema, model, type Document } from "mongoose";

export interface RoomDoc extends Document {
  title: string;
  departure: string;
  destination: string;
  departureTime: Date;
  maxPassenger: number;
  participants: string[]; // userId 문자열 배열
  hostId: string; // 방장 userId
}

const RoomSchema = new Schema<RoomDoc>(
  {
    title: { type: String, required: true },
    departure: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true },
    maxPassenger: { type: Number, required: true },
    participants: { type: [String], default: [] },
    hostId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Room = model<RoomDoc>("Room", RoomSchema);
```

> 프론트에는 `departureTime`이 문자열(ISO)로 보이지만,  
> Mongoose가 `Date → ISO string` 으로 자동 직렬화해 주기 때문에 문제 없다.

---

## 5. 3단계 – rooms 라우터를 Mongo 버전으로 교체 (`src/routes/rooms.ts`)

### 5-1. 유틸: 현재 로그인 유저 아이디 가져오기 (임시)

지금은 아직 세션을 room-service에 완전히 붙이지 않았으므로,  
우선은 auth-service와 맞춰서 **하드코딩 or 헤더 기반**으로 진행하고,  
나중에 `req.user.userId`를 쓰도록 바꾸기 쉽게 만들어 둔다.

```ts
// room-service/src/utils/currentUser.ts
import type { Request } from "express";

// TODO: 1차 구현: 임시로 "me" 사용
// TODO: 2차 구현: Redis 세션에서 userId 추출
export function getCurrentUserId(req: Request): string {
  // 나중에: req.cookies.sid → Redis → userId
  return "me";
}
```

### 5-2. 기존 rooms 라우터를 Mongo 버전으로 교체

```ts
// room-service/src/routes/rooms.ts
import { Router } from "express";
import { Room } from "../models/Room";
import { getCurrentUserId } from "../utils/currentUser";

const router = Router();

// GET /rooms (검색 + participant 필터)
router.get("/", async (req, res) => {
  const departure = String(req.query.departure || "").trim();
  const destination = String(req.query.destination || "").trim();
  const participant = String(req.query.participant || "").trim();

  const filter: any = {};

  if (departure) {
    filter.departure = { $regex: departure, $options: "i" };
  }
  if (destination) {
    filter.destination = { $regex: destination, $options: "i" };
  }
  if (participant) {
    // hostId 이거나 participants 배열 안에 포함된 방만
    filter.$or = [{ hostId: participant }, { participants: participant }];
  }

  const rooms = await Room.find(filter)
    .sort({ departureTime: 1 })
    .lean()
    .exec();

  return res.json({ rooms });
});

// GET /rooms/:id
router.get("/:id", async (req, res) => {
  const room = await Room.findById(req.params.id).lean().exec();
  if (!room) return res.status(404).json({ message: "Room not found" });
  return res.json(room);
});

// POST /rooms
router.post("/", async (req, res) => {
  const { title, departure, destination, departureTime, maxPassenger } =
    req.body || {};

  if (!title || !departure || !destination || !departureTime || !maxPassenger) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const userId = getCurrentUserId(req);

  const room = await Room.create({
    title,
    departure,
    destination,
    departureTime, // string이어도 Date로 캐스팅됨
    maxPassenger,
    hostId: userId,
    participants: [userId],
  });

  return res.status(201).json(room);
});

// POST /rooms/:id/join
router.post("/:id/join", async (req, res) => {
  const userId = getCurrentUserId(req);

  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  if (!room.participants.includes(userId)) {
    room.participants.push(userId);
    await room.save();
  }

  return res.json(room);
});

// POST /rooms/:id/leave
router.post("/:id/leave", async (req, res) => {
  const userId = getCurrentUserId(req);

  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  room.participants = room.participants.filter((p) => p !== userId);
  await room.save();

  return res.json(room);
});

export default router;
```

> **중요**  
> 더 이상 `../data/rooms.db` 를 import 하지 않는다.  
> 사용하지 않는 파일은 남겨둬도 되지만, 헷갈리면 나중에 삭제해도 된다.

---

## 6. 4단계 – index.ts에서 Mongo 연결 후 서버 시작

기존 `room-service/src/index.ts` 상단에서 `connectMongo`를 불러와서,  
**연결이 끝난 뒤에만 `app.listen`을 호출**하도록 바꾼다.

```ts
// room-service/src/index.ts
import express from "express";
import cookieParser from "cookie-parser";
import roomsRouter from "./routes/rooms";
import { connectMongo } from "./db/mongo";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/rooms", roomsRouter);

const PORT = process.env.PORT || 8081;

async function start() {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`[room-service] on ${PORT}`);
  });
}

start();
```

---

## 7. 5단계 – 세션 + userId 연동(다음 단계용 메모)

현재 문서에서는 편의상 `getCurrentUserId` 안에서 `"me"`를 반환한다.  
다음 단계에서 아래 순서로 교체하면 된다.

1. auth-service에서 사용하는 **Redis 세션 형식**을 확인  
   예: `session:${sid} → { userId, name }`
2. room-service에도 Redis 클라이언트를 붙인다.
3. `getCurrentUserId` 구현을 다음과 같이 변경한다.

```ts
// (예시) 쿠키 sid → Redis 조회 → userId 반환
import type { Request } from "express";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

export async function getCurrentUserId(req: Request): Promise<string | null> {
  const sid = req.cookies?.sid;
  if (!sid) return null;
  const raw = await redis.get(`session:${sid}`);
  if (!raw) return null;
  const session = JSON.parse(raw);
  return session.userId as string;
}
```

> 이때는 라우터에서 `getCurrentUserId` 를 `await` 해서 쓰도록 리팩토링하면 된다.

---

## 8. 체크리스트

Mongo 마이그레이션이 끝난 뒤 아래 항목을 직접 확인해 본다.

1. **방 생성 후** `/api/rooms` 응답에 새 방이 포함되는지
2. **새로고침 후에도** 목록이 그대로 유지되는지 (DB에 저장되었는지)
3. 마이페이지(`/me`)에서
   - 방을 만들면 `만든 방` 카운트가 1 이상으로 올라가는지
   - 참여만 한 방은 `참여한 방`에만 카운트되는지
4. Mongo 쉘(or Compass)에서 `campus_taxi.rooms` 컬렉션을 조회했을 때  
   문서 구조가 `docs/api.md` 와 호환되는지
