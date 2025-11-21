// 로그인/회원가입 API 처리 + Mongo + Redis 세션 기반 인증

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { MongoClient, ObjectId } from "mongodb";
import Redis from "ioredis";

const app = express();

// CORS: 프론트는 nginx 통해 http://localhost 로 접속
app.use(
  cors({
    origin: "http://localhost",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost", // nginx 앞단에서 origin은 localhost
    credentials: true,
  })
);

// 1. Docker 기준 Mongo / Redis URL 설정
//  - docker-compose.yml 에서 taxi-mongo, taxi-redis 라는 서비스 이름을 쓴다고 가정
//  - 둘 다 환경변수로 오버라이드 가능 (MONGO_URL, REDIS_URL)
const MONGO_URL =
  process.env.MONGO_URL || "mongodb://taxi-mongo:27017/campus_taxi";
const REDIS_URL =
  process.env.REDIS_URL || "redis://taxi-redis:6379";

// Mongo / Redis 클라이언트
const mongoClient = new MongoClient(MONGO_URL);
const redis = new Redis(REDIS_URL);

// users 컬렉션 핸들
let users: any;

/* --------------------------------------------------
   /api/auth/signup
   회원가입 + 자동 로그인(세션 생성)
---------------------------------------------------*/
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ message: "bad_request" });
  }

  const exists = await users.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "exists" });
  }

  // bcrypt 해시 적용
  const hashed = await bcrypt.hash(password, 10);

  const { insertedId } = await users.insertOne({
    email,
    password: hashed,
    name,
    createdAt: new Date(),
  });

  // 세션 발급 (room-service 와 동일 포맷: { userId, name })
  const sid = crypto.randomUUID();
  const sessionValue = { userId: String(insertedId), name };
  await redis.set(
    `session:${sid}`,
    JSON.stringify(sessionValue),
    "EX",
    60 * 60 * 24
  );

  res.cookie("sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

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

  if (!email || !password) {
    return res.status(400).json({ message: "bad_request" });
  }

  const me = await users.findOne({ email });
  if (!me) {
    return res.status(401).json({ message: "invalid" });
  }

  const ok = await bcrypt.compare(password, me.password);
  if (!ok) {
    return res.status(401).json({ message: "invalid" });
  }

  const sid = crypto.randomUUID();
  const sessionValue = { userId: me._id.toString(), name: me.name };

  await redis.set(
    `session:${sid}`,
    JSON.stringify(sessionValue),
    "EX",
    60 * 60 * 24
  );

  res.cookie("sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

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
  if (!sid) {
    return res.status(401).json({ message: "no session" });
  }

  const raw = await redis.get(`session:${sid}`);
  if (!raw) {
    return res.status(401).json({ message: "expired" });
  }

  const { userId } = JSON.parse(raw) as { userId: string; name: string };

  const me = await users.findOne({ _id: new ObjectId(userId) });
  if (!me) {
    return res.status(404).json({ message: "not found" });
  }

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
   서버 시작
---------------------------------------------------*/
async function start() {
  try {
    // MongoDB 연결
    await mongoClient.connect();
    const db = mongoClient.db(); // URL에 campus_taxi 가 포함되어 있으므로 기본 DB 사용
    users = db.collection("users");

    console.log("[auth-service] MongoDB connected:", MONGO_URL);
    console.log("[auth-service] Redis connected:", REDIS_URL);

    // 포트는 Nginx와 반드시 맞춰서 고정: 8080
    const port = 8080;
    app.listen(port, () => {
      console.log(`[auth-service] listening on ${port}`);
    });
  } catch (err) {
    console.error("[auth-service] start error:", err);
    process.exit(1);
  }
}

start();
