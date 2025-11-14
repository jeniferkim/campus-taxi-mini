// Redis 세션 인증 핵심
//나중에 실제 auth-service 코드랑 key/값 구조 한 번 맞춰보면 더 안전.
// session:${sid} 읽어서 req.user 세팅

import { Request, Response, NextFunction } from "express";
import redis from "../libs/redisClient";
import type { SessionData } from "../types/session";

const SESSION_PREFIX = "session:";

export async function auth(req: Request, res: Response, next: NextFunction) {
  const sid = req.cookies?.sid;

  if (!sid) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const rawSession = await redis.get(`${SESSION_PREFIX}${sid}`);

    if (!rawSession) {
      return res.status(401).json({ message: "세션이 유효하지 않습니다." });
    }

    const session = JSON.parse(rawSession) as SessionData;

    if (!session.userId) {
      return res.status(401).json({ message: "세션 정보가 올바르지 않습니다." });
    }

    // 이후 라우터에서 사용할 사용자 정보
    req.user = {
      id: session.userId,
      name: session.name,
    };

    return next();
  } catch (e) {
    return res
      .status(500)
      .json({ message: "세션 정보 조회 중 오류가 발생했습니다." });
  }
}
