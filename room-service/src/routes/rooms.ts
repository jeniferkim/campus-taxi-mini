import { Router, Request, Response, NextFunction } from "express";
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
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departure = String(req.query.departure || "");
    const destination = String(req.query.destination || "");
    const participant = String(req.query.participant || "");
  
    const rooms = await findRooms({ 
      departure: departure || undefined,
      destination: destination || undefined,
      participant: participant || undefined,
    });

    return res.json({ rooms });
  } catch (err) {
    // 여기서 바로 500 응답을 주거나, 공통 에러 핸들러로 넘긴다.
    next(err);
  }
});

// GET /rooms/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await findRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
  
    return res.json(room);
  } catch (err) {
    next(err);
  }
});

// POST /rooms (로그인 필수)
router.post("/", auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authedReq = req as AuthedRequest;  // 여기에서만 캐스팅
    const { title, departure, destination, departureTime, maxPassenger } =
      authedReq.body;
  
    if (!title || !departure || !destination || !departureTime || !maxPassenger) {
      return res.status(400).json({ message: "Missing required fields for room creation" });
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
      maxPassenger: Number(maxPassenger),
      hostId: userId,
      hostName: userName, // 여기서 항상 값이 들어가도록
    });
  
    return res.status(201).json(newRoom);
  } catch (err) {
    next(err);
  }
});

// POST /rooms/:id/join (로그인 필수)
router.post("/:id/join", auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

// POST /rooms/:id/leave (로그인 필수)
router.post("/:id/leave", auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authedReq = req as AuthedRequest;
    const roomId = authedReq.params.id;
    const userId = authedReq.user.id;
  
    const room = await leaveRoomDb(roomId, userId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
  
    return res.json(room);
  } catch (err) {
    next(err);
  }
});

export default router;
