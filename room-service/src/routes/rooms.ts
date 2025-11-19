import { Router, Request, Response } from "express";
import auth from "../middlewares/auth";
import type { AuthedRequest } from "../types/authed-request";
import {
  findRooms,
  findRoomById,
  createRoom,
  joinRoom as joinRoomDb,
  leaveRoom as leaveRoomDb,
} from "../data/rooms.db";

const router = Router();

// GET /rooms
router.get("/", async (req: Request, res: Response) => {
  const departure = String(req.query.departure || "");
  const destination = String(req.query.destination || "");
  const participant = String(req.query.participant || "");

  const rooms = await findRooms({ departure, destination, participant });
  return res.json({ rooms });
});

// GET /rooms/:id
router.get("/:id", async (req: Request, res: Response) => {
  const room = await findRoomById(req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  return res.json(room);
});

// POST /rooms (로그인 필수)
router.post("/", auth, async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;  // 여기에서만 캐스팅
  const { title, departure, destination, departureTime, maxPassenger } =
    authedReq.body;

  if (!title || !departure || !destination || !departureTime || !maxPassenger) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // room-service에서는 user.name 거의 안 씀
  // user.id만 제대로 있으면 됨
  const userId = authedReq.user.id;
  const userName = authedReq.user.name;

  const newRoom = await createRoom({
    title,
    departure,
    destination,
    departureTime,
    maxPassenger,
    hostId: userId,
    hostName: userName,
  });

  return res.status(201).json(newRoom);
});

// POST /rooms/:id/join (로그인 필수)
router.post("/:id/join", auth, async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  const roomId = authedReq.params.id;
  const userId = authedReq.user.id;

  console.log("🚕 [JOIN API] roomId =", roomId, "userId =", userId);

  const room = await joinRoomDb(roomId, userId);
  if (!room) {
    console.log("🚕 [JOIN API] Room not found for id =", roomId);
    return res.status(404).json({ message: "Room not found" });
  }

  return res.json(room);
});

// POST /rooms/:id/leave (로그인 필수)
router.post("/:id/leave", auth, async (req: Request, res: Response) => {
  const authedReq = req as AuthedRequest;
  const roomId = authedReq.params.id;
  const userId = authedReq.user.id;

  const room = await leaveRoomDb(roomId, userId);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  return res.json(room);
});

export default router;
