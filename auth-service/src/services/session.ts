// 세션 생성/삭제 로직
// 세션 생성/삭제를 서비스 계층으로 분리

import Redis from "ioredis";
import crypto from "crypto";
import type { Response } from "express";
import type { SessionUser } from "../types/session";

const redis = new Redis(process.env.REDIS_URL || "redis://taxi-redis:6379");

const SESSION_PREFIX = "session:";
const SESSION_TTL = 60 * 60 * 24;

export async function createSession(res: Response, user: SessionUser) {
  const sid = crypto.randomUUID();

  await redis.setex(
    `${SESSION_PREFIX}${sid}`,
    SESSION_TTL,
    JSON.stringify(user)
  );

  res.cookie("sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return sid;
}

export async function deleteSession(sid?: string) {
  if (!sid) return;
  await redis.del(`${SESSION_PREFIX}${sid}`);
}

export async function getSession(sid?: string): Promise<SessionUser | null> {
  if (!sid) return null;
  const raw = await redis.get(`${SESSION_PREFIX}${sid}`);
  if (!raw) return null;
  return JSON.parse(raw);
}
