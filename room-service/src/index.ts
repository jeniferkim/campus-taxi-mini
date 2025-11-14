// 방 생성 / 참여 / 검색 API 처리

import express from "express";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";
import Redis from "ioredis";

import type { Request, Response, RequestHandler } from "express";

type SessionUser = { userId: string; name: string };
type AuthedRequest = Request & { user: SessionUser };

const app = express();
app.use(express.json());
app.use(cookieParser());

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const client = new MongoClient(MONGO_URL);
const redis = new Redis(REDIS_URL);

let rooms: any;

/* ----------------------
   세션 인증 미들웨어
----------------------- */
const auth: RequestHandler = async (req, res, next) => {
  const sid = req.cookies.sid;
  if (!sid) return res.status(401).json({ message: "no session" });

  const raw = await redis.get(`session:${sid}`);
  if (!raw) return res.status(401).json({ message: "expired" });

  (req as AuthedRequest).user = JSON.parse(raw) as SessionUser;
  next();
};

/* ----------------------
   ObjectId → string 변환 헬퍼
----------------------- */
function normalizeRoom(room: any) {
  if (!room) return null;

  return {
    _id: room._id.toString(),
    title: room.title,
    departure: room.departure,
    destination: room.destination,
    departureTime: room.departureTime,
    maxPassenger: room.maxPassenger,
    hostId: room.hostId?.toString(),
    participants: room.participants?.map((p: any) => p.toString()),
    createdAt: room.createdAt,
  };
}

/* ----------------------
   방 목록 조회
   GET /api/rooms
----------------------- */
app.get("/api/rooms", async (req, res) => {
  const { departure, destination, participant } = req.query;

  const q: any = {};

  if (departure) q.departure = departure;
  if (destination) q.destination = destination;

  // 특정 유저가 만든 방 or 참여한 방
  // participant가 있을 때만 + 유효한 ObjectId일 때만 필터 적용
  if (participant && ObjectId.isValid(String(participant))) {
    const pid = new ObjectId(String(participant));

    q.$or = [
      { hostId: pid },
      { participants: { $in: [pid] } }
    ];
  }

  const list = await rooms.find(q).sort({ departureTime: 1 }).toArray();

  res.json({
    rooms: list.map(normalizeRoom)
  });
});

/* ----------------------
   방 생성
   POST /api/rooms
----------------------- */
app.post("/api/rooms", auth, async (req: Request, res: Response) => {
  const areq = req as AuthedRequest;
  const { title, departure, destination, departureTime, maxPassenger } = req.body;

  if (!title || !departure || !destination || !departureTime || !maxPassenger) {
    return res.status(400).json({ message: "missing fields" });
  }

  const myId = new ObjectId(areq.user.userId);

  const doc = {
    title,
    departure,
    destination,
    departureTime: new Date(departureTime),
    maxPassenger,
    hostId: myId,
    participants: [myId],
    createdAt: new Date()
  };

  const { insertedId } = await rooms.insertOne(doc);

  const created = await rooms.findOne({ _id: insertedId });

  res.json(normalizeRoom(created));
});

/* ----------------------
   방 참여
   POST /api/rooms/:id/join
----------------------- */
app.post("/api/rooms/:id/join", auth, async (req, res) => {
  const areq = req as AuthedRequest;

  const id = new ObjectId(req.params.id);
  const me = new ObjectId(areq.user.userId);

  await rooms.updateOne(
    { _id: id },
    { $addToSet: { participants: me } }
  );

  const room = await rooms.findOne({ _id: id });
  res.json(normalizeRoom(room));
});

/* ----------------------
   방 나가기
   POST /api/rooms/:id/leave
----------------------- */
app.post("/api/rooms/:id/leave", auth, async (req, res) => {
  const areq = req as AuthedRequest;

  const id = new ObjectId(req.params.id);
  const me = new ObjectId(areq.user.userId);

  await rooms.updateOne(
    { _id: id },
    { $pull: { participants: me } }
  );

  const room = await rooms.findOne({ _id: id });
  res.json(normalizeRoom(room));
});

/* ----------------------
   방 상세 조회
   GET /api/rooms/:id
----------------------- */
app.get("/api/rooms/:id", async (req, res) => {
  const r = await rooms.findOne({ _id: new ObjectId(req.params.id) });
  if (!r) return res.status(404).json({ message: "not found" });

  res.json(normalizeRoom(r));
});

/* ----------------------
   서버 시작
----------------------- */
async function start() {
  await client.connect();
  const db = client.db("campus_taxi");
  rooms = db.collection("rooms");

  const port = process.env.PORT || 8081;
  app.listen(port, () => console.log(`[room] on ${port}`));
}

start();
