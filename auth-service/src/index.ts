// 로그인/회원가입 API 처리 + Mongo + Redis 세션 기반 인증

import express from "express";
import cookieParser from "cookie-parser";
import { MongoClient, ObjectId } from "mongodb";
import Redis from "ioredis";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost", // nginx 앞단에서 실제 origin으로 변경될 예정
    credentials: true,
  })
);

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const client = new MongoClient(MONGO_URL);
const redis = new Redis(REDIS_URL);

let users: any;

/* --------------------------------------------------
   /api/auth/signup
   회원가입 + 자동 로그인(세션 생성)
---------------------------------------------------*/
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || !name)
    return res.status(400).json({ message: "bad_request" });

  const exists = await users.findOne({ email });
  if (exists) return res.status(409).json({ message: "exists" });

  // bcrypt 해시 적용
  const hashed = await bcrypt.hash(password, 10);

  const { insertedId } = await users.insertOne({
    email,
    password: hashed,
    name,
    createdAt: new Date(),
  });

  // 세션 발급
  const sid = crypto.randomUUID();
  const sessionValue = { userId: String(insertedId), name };
  await redis.set(
    `session:${sid}`,
    JSON.stringify(sessionValue),
    "EX",
    60 * 60 * 24
  );

  res.cookie("sid", sid, { httpOnly: true, path: "/" });

  res.json({
    user: {
      _id: String(insertedId),
      email,
      name,
    },
  });
});

/* --------------------------------------------------
   /api/auth/login
   이메일 + 비밀번호로 로그인
---------------------------------------------------*/
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};

  const me = await users.findOne({ email });
  if (!me) return res.status(401).json({ message: "invalid" });

  const ok = await bcrypt.compare(password, me.password);
  if (!ok) return res.status(401).json({ message: "invalid" });

  const sid = crypto.randomUUID();
  const sessionValue = { userId: me._id.toString(), name: me.name };
  await redis.set(
    `session:${sid}`,
    JSON.stringify(sessionValue),
    "EX",
    60 * 60 * 24
  );

  res.cookie("sid", sid, { httpOnly: true, path: "/" });

  res.json({
    user: {
      _id: me._id.toString(),
      email: me.email,
      name: me.name,
    },
  });
});

/* --------------------------------------------------
   /api/auth/me
   세션 기준으로 현재 로그인된 유저 정보 조회
---------------------------------------------------*/
app.get("/api/auth/me", async (req, res) => {
  const sid = req.cookies?.sid;
  if (!sid) return res.status(401).json({ message: "no session" });

  const raw = await redis.get(`session:${sid}`);
  if (!raw) return res.status(401).json({ message: "expired" });

  const { userId } = JSON.parse(raw);

  const me = await users.findOne({ _id: new ObjectId(userId) });
  if (!me) return res.status(404).json({ message: "not found" });

  res.json({
    user: {
      _id: me._id.toString(),
      email: me.email,
      name: me.name,
    },
  });
});

/* --------------------------------------------------
   /api/auth/logout
   세션 삭제 + 쿠키 제거
---------------------------------------------------*/
app.post("/api/auth/logout", async (req, res) => {
  const sid = req.cookies?.sid;
  if (sid) {
    await redis.del(`session:${sid}`);
    res.clearCookie("sid", { path: "/" });
  }
  res.json({ success: true });
});

/* --------------------------------------------------
   서버 연결
---------------------------------------------------*/
async function start() {
  await client.connect();
  const db = client.db("campus_taxi");
  users = db.collection("users");

  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`[auth] on ${port}`));
}

start();
