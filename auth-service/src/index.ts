// Node.js 환경에서 Express 서버를 띄우는 진짜 서버 코드
// 로그인/회원가입 같은 API 처리, DB/Redis 연결

import express from "express";
import cookieParser from "cookie-parser";
import { MongoClient } from "mongodb";
import Redis from "ioredis";

const app = express();
app.use(express.json());
app.use(cookieParser());

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const client = new MongoClient(MONGO_URL);
const redis = new Redis(REDIS_URL);

let users: any;

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  const exists = await users.findOne({ email });
  if (exists) return res.status(409).json({ message: "exists" });
  const { insertedId } = await users.insertOne({ email, password, name, createdAt: new Date() });
  res.json({ userId: insertedId });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await users.findOne({ email, password });
  if (!user) return res.status(401).json({ message: "invalid" });
  const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await redis.set(`session:${sid}`, JSON.stringify({ userId: String(user._id), name: user.name }), "EX", 60 * 60 * 24);
  res.cookie("sid", sid, { httpOnly: true, path: "/" });
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req, res) => {
  const sid = req.cookies.sid;
  if (!sid) return res.status(401).json({ message: "no session" });
  const raw = await redis.get(`session:${sid}`);
  if (!raw) return res.status(401).json({ message: "expired" });
  res.json(JSON.parse(raw));
});

async function start() {
  await client.connect();
  const db = client.db("campus_taxi");
  users = db.collection("users");
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`[auth] on ${port}`));
}
start();