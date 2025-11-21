import express from "express";
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

  // /rooms 라우터 마운트
  // Nginx에서 /api/rooms -> room-service:8081/rooms 로 프록시한다고 가정
  app.use("/rooms", roomsRouter);

  const port = 8081;

  app.listen(port, () => {
    console.log(`[room-service] listening on ${port}`);
  });
}

bootstrap();