import express, { 
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler, 
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { connectMongo } from "./libs/mongo";
import roomsRouter from "./routes/rooms";

async function bootstrap() {
  // bootstrap()은 초기화 + 서버 시작을 묶어서 실행하는 함수
  await connectMongo();
  
  const app = express();

  // JSON 바디 파싱
  app.use(express.json());

  // sid 쿠키 읽기용
  app.use(cookieParser());

  app.use(
    cors({
      origin: "http://localhost",
      credentials: true,
    })
  )

  // 1. /rooms 라우터 마운트
  // Nginx에서 /api/rooms -> room-service:8081/rooms 로 프록시한다고 가정
  app.use("/rooms", roomsRouter);

  // 2. 에러 핸들러 정의
  const errorHandler: ErrorRequestHandler = (
    err,
    req,
    res,
    next
  ): void => {
    console.error("[room-service] error:", err);

    // 이미 응답 헤더가 나간 경우, 기본 에러 핸들러에게 넘김
    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({ message: "Internal server error" });
  };

  // 3. 에러 핸들러 등록 (항상 라우트들 뒤에!)
  app.use(errorHandler);
  const port = 8081;
  app.listen(port, () => {
    console.log(`[room-service] listening on ${port}`);
  });
}

bootstrap();