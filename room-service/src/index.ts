// src/index.ts
import express from "express";
import cookieParser from "cookie-parser";
import roomsRouter from "./routes/rooms";

const app = express();

// JSON 바디 파싱
app.use(express.json());

// sid 쿠키 읽기용
app.use(cookieParser());

// /rooms 라우터 마운트
// Nginx에서 /api/rooms -> room-service:8081/rooms 로 프록시한다고 가정
app.use("/rooms", roomsRouter);

const port = process.env.PORT || 8081;

app.listen(port, () => {
  console.log(`[room-service] listening on ${port}`);
});
