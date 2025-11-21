// 세션 인증 미들웨어(auth)

import type { Request, Response, NextFunction } from "express";
import { getSession } from "../services/session";

export async function auth(req: Request, res: Response, next: NextFunction) {
  const sid = req.cookies?.sid;
  const user = await getSession(sid);

  if (!user) {
    return res.status(401).json({ message: "unauthorized" });
  }

  (req as any).user = user;
  next();
}
