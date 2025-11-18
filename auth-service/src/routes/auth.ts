import { Router } from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getUsersCollection } from "../db/users.js";
import type { RequestHandler, Request, Response } from "express";
import Redis from "ioredis";
import crypto from "crypto";

const router = Router();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

type SessionUser = { userId: string; name: string };

const SESSION_PREFIX = "session:";
const SESSION_TTL = 60 * 60 * 24; // 1 day

// 공통 세션 생성 함수
async function createSessionAndSetCookie(
  res: Response,
  user: { _id: ObjectId; name: string }
) {
  const sid = crypto.randomUUID();
  const sessionValue: SessionUser = {
    userId: user._id.toString(),
    name: user.name,
  };

  await redis.setex(
    `${SESSION_PREFIX}${sid}`,
    SESSION_TTL,
    JSON.stringify(sessionValue)
  );

  res.cookie("sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return sid;
}

const auth: RequestHandler = async (req, res, next) => {
  const sid = req.cookies.sid;
  if (!sid) return res.status(401).json({ message: "no session" });

  const raw = await redis.get(`session:${sid}`);
  if (!raw) return res.status(401).json({ message: "expired" });

  (req as any).user = JSON.parse(raw);
  next();
};

/* -------------------------
   POST /api/auth/signup
-------------------------- */
router.post("/signup", async (req: Request, res: Response) => {
  const users = getUsersCollection();
  const { email, password, name } = req.body;

  const exist = await users.findOne({ email });
  if (exist) return res.status(409).json({ message: "email already exists" });

  const hashed = await bcrypt.hash(password, 10);

  const doc = {
    email,
    password: hashed,
    name,
    createdAt: new Date(),
  };

  const { insertedId } = await users.insertOne(doc);
  const user = await users.findOne({ _id: insertedId });
  if (!user) {
    return res.status(500).json({ message: "failed to create user" });
  }

  // 세션 생성 + sid 쿠키 설정
  await createSessionAndSetCookie(res, user);

  res.status(201).json({
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  });
});


/* -------------------------
   POST /api/auth/login
-------------------------- */
router.post("/login", async (req, res) => {
  const users = getUsersCollection();
  const { email, password } = req.body;

  const user = await users.findOne({ email });
  if (!user) return res.status(401).json({ message: "invalid email/password" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "invalid email/password" });

  // 세션 생성 + 쿠키 설정
  await createSessionAndSetCookie(res, user);

  res.json({
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  });
});


/* -------------------------
   POST /api/auth/logout
-------------------------- */
router.post("/logout", async (req, res) => {
  const sid = req.cookies.sid;

  if (sid) {
    await redis.del(`session:${sid}`);
  }

  res.clearCookie("sid");
  res.json({ success: true });
});

/* -------------------------
   GET /api/auth/me
-------------------------- */
router.get("/me", auth, async (req, res) => {
  const users = getUsersCollection();
  const userSession = (req as any).user as SessionUser;

  const user = await users.findOne({ _id: new ObjectId(userSession.userId) });
  if (!user) return res.status(404).json({ message: "not found" });

  res.json({
    user: {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
  });
});

export default router;
