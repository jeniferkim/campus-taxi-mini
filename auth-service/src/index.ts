// 로그인/회원가입 API + Mongo & Redis 세션 기반 인증 서버 부트스트랩

import express, {
  type Request,
  type Response,
  type NextFunction,
  type ErrorRequestHandler,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectMongo } from "./db/mongo";
import authRouter from "./routes/auth";

async function bootstrap() {
  // 1) Mongo 연결 (users 컬렉션 초기화 포함)
  await connectMongo();

  // 2) Express 앱 생성 및 공통 미들웨어
  const app = express();

  app.use(
    cors({
      origin: "http://localhost",
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // 3) /api/auth 라우트 마운트
  app.use("/api/auth", authRouter);

  // 4) 공통 에러 핸들러 (room-service 와 동일 패턴)
  const errorHandler: ErrorRequestHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error("[auth-service] error:", err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({ message: "Internal server error" });
  };

  app.use(errorHandler);

  // 5) 서버 시작
  const port = Number(process.env.PORT) || 8080;
  app.listen(port, () => {
    console.log(`[auth-service] listening on ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("[auth-service] bootstrap fatal error:", err);
  process.exit(1);
});
