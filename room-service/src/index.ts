// 방 생성 / 참여 / 검색 API 처리

import express from "express";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";
import Redis from "ioredis";

import type { Request, Response, NextFunction, RequestHandler } from "express";
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

const auth: RequestHandler = async (req, res, next) => {
  const sid = req.cookies.sid;
  if (!sid) return res.status(401).json({ message: "no session" });
  const raw = await redis.get(`session:${sid}`);
  if (!raw) return res.status(401).json({ message: "expired" });
  (req as AuthedRequest).user = JSON.parse(raw) as SessionUser;
  next();
};


app.get("/api/rooms", async (req, res) => {
  const { departure, destination, participant } = req.query;
  const q: any = {};
  if (departure) q.departure = departure;
  if (destination) q.destination = destination;
  if (participant) q.participants = { $in: [ new ObjectId(String(participant)) ] };
  const list = await rooms.find(q).sort({ departureTime: 1 }).toArray();
  res.json(list);
});


// 방 생성
app.post("/api/rooms", auth, async (req: Request, res: Response) => {
  const areq = req as AuthedRequest;
  const { title, departure, destination, departureTime, maxPassenger } = req.body;
  const doc = {
    title,
    departure,
    destination,
    departureTime: new Date(departureTime),
    maxPassenger,
    hostId: new ObjectId(areq.user.userId),
    participants: [new ObjectId(areq.user.userId)],
    createdAt: new Date(),
  };
  const { insertedId } = await rooms.insertOne(doc);
  res.json({ roomId: insertedId });
});

// 참여
app.post("/api/rooms/:id/join", auth, async (req: Request, res: Response) => {
  const areq = req as AuthedRequest;
  const id = new ObjectId(req.params.id);
  const me = new ObjectId(areq.user.userId);
  await rooms.updateOne({ _id: id }, { $addToSet: { participants: me } });
  res.json({ ok: true });
});

// 나가기
app.post("/api/rooms/:id/leave", auth, async (req: Request, res: Response) => {
  const areq = req as AuthedRequest;
  const id = new ObjectId(req.params.id);
  const me = new ObjectId(areq.user.userId);
  await rooms.updateOne({ _id: id }, { $pull: { participants: me } });
  res.json({ ok: true });
});


app.get("/api/rooms/:id", async (req, res) => {
  const room = await rooms.findOne({ _id: new ObjectId(req.params.id) });
  if (!room) return res.status(404).json({ message: "not found" });
  res.json(room);
});

async function start() {
  await client.connect();
  const db = client.db("campus_taxi");
  rooms = db.collection("rooms");
  const port = process.env.PORT || 8081;
  app.listen(port, () => console.log(`[room] on ${port}`));
}
start();