// Node.js 환경에서 Express 서버를 띄우는 진짜 서버 코드
// 로그인/회원가입 같은 API 처리, DB/Redis 연결

import express from "express";
import cookieParser from "cookie-parser";
import { MongoClient } from "mongodb";
import Redis from "ioredis";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cookieParser());

// 쿠키 기반 인증 확인 (세션 유지용)
app.use(cors({
  origin: "http://localhost",
  credentials: true,
}));

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const client = new MongoClient(MONGO_URL);
const redis = new Redis(REDIS_URL);

let users: any;

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ message: "bad_request" });

  const exists = await users.findOne({ email });
  if (exists) return res.status(409).json({ message: "exists" });

  const { insertedId } = await users.insertOne({
    email, password, name, createdAt: new Date()
  });

  // 바로 로그인 상태로 세션 발급(선택)
  const sid = crypto.randomUUID();
  await redis.set(`session:${sid}`, JSON.stringify({ userId: String(insertedId), name }), "EX", 60 * 60 * 24);
  res.cookie("sid", sid, { httpOnly: true, path: "/" });

  return res.json({ userId: insertedId, email, name });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const me = await users.findOne({ email, password });
  if (!me) return res.status(401).json({ message: "invalid" });
  const sid = crypto.randomUUID();
  await redis.set(`session:${sid}`, JSON.stringify({ userId: String(me._id), name: me.name }), "EX", 60 * 60 * 24);
  res.cookie("sid", sid, { httpOnly: true, path: "/" });
  res.json({ _id: me._id, email: me.email, name: me.name });
});

app.get("/api/auth/me", async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).json({ message: "no session" });
  const raw = await redis.get(`session:${sid}`);
  if (!raw) return res.status(401).json({ message: "expired" });
  res.json(JSON.parse(raw));
});

app.post("/api/auth/logout", async (req, res) => {
  const sid = req.cookies?.sid;
  if (sid) {
    await redis.del(`session:${sid}`);
    res.clearCookie("sid", { path: "/" });
  }
  res.json({ ok: true });
});

async function start() {
  await client.connect();
  const db = client.db("campus_taxi");
  users = db.collection("users");
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`[auth] on ${port}`));
}

start();