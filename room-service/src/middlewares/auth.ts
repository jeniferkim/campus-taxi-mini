// src/middlewares/auth.ts
// Redis 세션 인증 미들웨어

import type { Request, Response, NextFunction } from "express";
import redis from "../libs/redisClient";
import type { SessionData } from "../types/session";
import type { AuthedRequest } from "../types/authed-request";

const SESSION_PREFIX = "session:";

export default async function auth(
  req: Request,        // 여기서는 그냥 Request
  res: Response,
  next: NextFunction
) {
  const sid =
    (req as AuthedRequest).cookies?.sid ??
    (req as any).cookies?.sid ??
    (req.headers.cookie || "").split("sid=")[1]?.split(";")[0]; // 혹시 cookie-parser 문제 대비

  console.log("🧩 [ROOM AUTH] incoming sid =", sid);

  if (!sid) {
    return res.status(401).json({ message: "로그인이 필요합니다.(no sid)" });
  }

  try {
    const rawSession = await redis.get(`${SESSION_PREFIX}${sid}`);

    if (!rawSession) {
      return res
        .status(401)
        .json({ message: "세션이 유효하지 않습니다.(no session)" });
    }

    const session = JSON.parse(rawSession) as SessionData;

    console.log("🧩 [ROOM AUTH] parsed session =", session);

    if (!session.userId) {
      return res
        .status(401)
        .json({ message: "세션 정보가 올바르지 않습니다.(no userId)" });
    }

    const authedReq = req as AuthedRequest;
    authedReq.user = {
      id: session.userId,
      name: session.name,
    };

    console.log("🧩 [ROOM AUTH] authedReq.user =", authedReq.user);

    return next();
  } catch (e) {
    console.error("💥 [ROOM AUTH ERROR]", e);
    return res
      .status(500)
      .json({ message: "세션 정보 조회 중 오류가 발생했습니다." });
  }
}
