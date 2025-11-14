import { Router } from "express";
import { v4 as uuid } from "uuid";

const router = Router();

// GET /rooms (검색 + participant 필터)
router.get("/", (req, res) => {
  const departure = String(req.query.departure || "");
  const destination = String(req.query.destination || "");
  const participant = String(req.query.participant || "");

  let filtered = [...rooms];

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
router.get("/:id", (req, res) => {
  const room = rooms.find((r) => r._id === req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  return res.json(room);
});

// POST /rooms
router.post("/", (req, res) => {
  const { title, departure, destination, departureTime, maxPassenger } = req.body;

  if (!title || !departure || !destination || !departureTime || !maxPassenger) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const newRoom: Room = {
    _id: uuid(),
    title,
    departure,
    destination,
    departureTime,
    maxPassenger,
    hostId: "me",
    participants: ["me"]
  };

  rooms.push(newRoom);

  return res.status(201).json(newRoom);
});

// POST /rooms/:id/join
router.post("/:id/join", (req, res) => {
  const room = rooms.find((r) => r._id === req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  const userId = "me";

  if (!room.participants.includes(userId)) {
    room.participants.push(userId);
  }

  return res.json(room);
});

// POST /rooms/:id/leave
router.post("/:id/leave", (req, res) => {
  const room = rooms.find((r) => r._id === req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });

  const userId = "me";
  room.participants = room.participants.filter((p) => p !== userId);

  return res.json(room);
});

export default router;
