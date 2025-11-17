// src/routes/rooms.ts
// 방 목록/상세/생성/참여/나가기 라우터

import { Router, Request, Response } from "express";
import auth from "../middlewares/auth";
import type { AuthedRequest } from "../types/authed-request";
import {
  rooms,
  type Room,
  createRoom,
  joinRoom as joinRoomDb,
  leaveRoom as leaveRoomDb,
} from "../data/rooms.db";

const router = Router();

// GET /rooms (검색 + participant 필터)
router.get("/", (req: Request, res: Response) => {
  const departure = String(req.query.departure || "");
  const destination = String(req.query.destination || "");
  const participant = String(req.query.participant || "");

  let filtered: Room[] = [...rooms];

  if (departure) {
    filtered = filtered.filter((r) => r.departure.includes(departure));
  }
  if (destination) {
    filtered = filtered.filter((r) => r.destination.includes(destination));
  }
  if (participant) {
    filtered = filtered.filter((r) => {
      return r.hostId === participant || r.participants.includes(participant);
    });
  }

  return res.json({ rooms: filtered });
});

// GET /rooms/:id
router.get("/:id", (req: Request, res: Response) => {
  const room = rooms.find((r) => r._id === req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  return res.json(room);
});

// POST /rooms  (로그인 필수)
router.post("/", auth, (req: AuthedRequest, res: Response) => {
  const { title, departure, destination, departureTime, maxPassenger } = req.body;

  if (!title || !departure || !destination || !departureTime || !maxPassenger) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const userId = req.user.id;

  const newRoom = createRoom({
    title,
    departure,
    destination,
    departureTime,
    maxPassenger,
    hostId: userId,
    // participants는 createRoom 내부에서 [hostId]로 설정
  });

  return res.status(201).json(newRoom);
});

// 참여 API
// POST /rooms/:id/join  (로그인 필수)
router.post("/:id/join", auth, (req: AuthedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const roomId = req.params.id;
  const userId = req.user.id;

  const room = joinRoomDb(roomId, userId);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  return res.json(room);
});

// 나가기 API
// POST /rooms/:id/leave  (로그인 필수)
router.post("/:id/leave", auth, (req: AuthedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  const roomId = req.params.id;
  const userId = req.user.id;

  const room = leaveRoomDb(roomId, userId);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  return res.json(room);
});

export default router;
