// frontend/src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import type { Room } from "../types/room";

// ------------------------------
// 타입 & 상수
// ------------------------------

type User = {
  _id: string;
  email: string;
  name: string;
};

const CURRENT_USER_ID = "me";

// ------------------------------
// mock 데이터
// ------------------------------

const mockUsers: User[] = [
  {
    _id: CURRENT_USER_ID,
    email: "me@example.com",
    name: "캠퍼스 택시 유저",
  },
  {
    _id: "user1",
    email: "user1@example.com",
    name: "사용자1",
  },
  {
    _id: "user2",
    email: "user2@example.com",
    name: "사용자2",
  },
];

// Room 타입은 ../types/room 에 정의된 걸 그대로 사용
let mockRooms: Room[] = [
  {
    _id: "1",
    title: "카이스트 → 대전역",
    departure: "카이스트",
    destination: "대전역",
    departureTime: "2025-11-15T10:00:00.000Z",
    maxPassenger: 4,
    // participants?: Array<string | { _id: string }>;
    participants: ["user1"],
    hostId: "user1",
  },
  {
    _id: "2",
    title: "카이스트 → 유성온천",
    departure: "카이스트",
    destination: "유성온천",
    departureTime: "2025-11-16T13:00:00.000Z",
    maxPassenger: 3,
    participants: [],
    hostId: "user2",
  },
  {
    _id: "3",
    title: "카이스트 → 정부청사",
    departure: "카이스트",
    destination: "정부청사",
    departureTime: "2025-11-20T09:30:00.000Z",
    maxPassenger: 4,
    participants: [CURRENT_USER_ID],
    hostId: CURRENT_USER_ID,
  },
];

// ------------------------------
// 핸들러들
// ------------------------------

export const handlers = [
  // ==========================
  // Auth 관련 (경로: /api/auth/...)
  // ==========================

  // POST /api/auth/signup
  // -> auth.ts: postSignup(data)
  // -> 예상 응답: { user }
  http.post("/api/auth/signup", async ({ request }) => {
    const { email, name } = (await request.json()) as {
      email: string;
      password: string;
      name: string;
    };

    const newUser: User = {
      _id: CURRENT_USER_ID,
      email,
      name: name || "새 유저",
    };

    return HttpResponse.json(
      {
        user: newUser,
      },
      { status: 201 }
    );
  }),

  // POST /api/auth/login
  // -> auth.ts: postLogin(data)
  // -> 예상 응답: { user }
  http.post("/api/auth/login", async ({ request }) => {
    const { email } = (await request.json()) as {
      email: string;
      password: string;
    };

    const user =
      mockUsers.find((u) => u.email === email) ?? mockUsers[0];

    return HttpResponse.json(
      {
        user,
      },
      { status: 200 }
    );
  }),

  // POST /api/auth/logout
  // -> auth.ts: postLogout()
  // -> 예상 응답: { success: true }
  http.post("/api/auth/logout", () => {
    return HttpResponse.json(
      { success: true },
      { status: 200 }
    );
  }),

  // GET /api/auth/me
  // -> auth.ts: getMyInfo()
  // -> 예상 응답: { user }
  http.get("/api/auth/me", () => {
    const user = mockUsers.find((u) => u._id === CURRENT_USER_ID)!;

    return HttpResponse.json(
      {
        user,
      },
      { status: 200 }
    );
  }),

  // ==========================
  // Room 관련 (경로: /api/rooms/...)
  // ==========================

  // GET /api/rooms
  // -> room.ts: getRoomList(departure?, destination?)
  // -> axios 타입: axiosInstance.get<{ rooms: Room[] }>("/rooms", ...)
  // -> 따라서 응답도 { rooms: Room[] } 로 감싸야 함
  http.get("/api/rooms", ({ request }) => {
    const url = new URL(request.url);
    const departure = url.searchParams.get("departure") || "";
    const destination = url.searchParams.get("destination") || "";
    // _ts 파라미터는 캐시 우회용이므로 무시해도 됨

    const filtered = mockRooms.filter((room) => {
      const depOk = departure
        ? room.departure.includes(departure)
        : true;
      const destOk = destination
        ? room.destination.includes(destination)
        : true;
      return depOk && destOk;
    });

    return HttpResponse.json(
      {
        rooms: filtered,
      },
      { status: 200 }
    );
  }),

  // GET /api/rooms/:id
  // -> room.ts: getRoom(id)
  // -> axios 타입 지정 안 했으므로 Room 그대로 리턴
  http.get("/api/rooms/:id", ({ params }) => {
    const { id } = params;
    const room = mockRooms.find((r) => r._id === id);

    if (!room) {
      return HttpResponse.json(
        { message: "Room not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json(room, { status: 200 });
  }),

  // POST /api/rooms
  // -> room.ts: createRoom(data)
  // -> 요청 body: { title, departure, destination, departureTime, maxPassenger }
  // -> 응답: 생성된 Room (하나)
  http.post("/api/rooms", async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      departure: string;
      destination: string;
      departureTime: string;
      maxPassenger: number;
    };

    const newRoom: Room = {
      _id: String(Date.now()),
      title: body.title,
      departure: body.departure,
      destination: body.destination,
      departureTime: body.departureTime,
      maxPassenger: body.maxPassenger,
      participants: [CURRENT_USER_ID],
      hostId: CURRENT_USER_ID,
    };

    mockRooms.push(newRoom);

    return HttpResponse.json(newRoom, { status: 201 });
  }),

  // POST /api/rooms/:id/join
  // -> room.ts: joinRoom(id)
  // -> 응답: 변경된 Room
  http.post("/api/rooms/:id/join", ({ params }) => {
    const { id } = params;
    const roomIndex = mockRooms.findIndex((r) => r._id === id);

    if (roomIndex === -1) {
      return HttpResponse.json(
        { message: "Room not found" },
        { status: 404 }
      );
    }

    const room = mockRooms[roomIndex];

    const participants = room.participants ?? [];
    const alreadyJoined = participants.some((p) =>
      typeof p === "string"
        ? p === CURRENT_USER_ID
        : p._id === CURRENT_USER_ID
    );

    if (!alreadyJoined) {
      participants.push(CURRENT_USER_ID);
    }

    mockRooms[roomIndex] = {
      ...room,
      participants,
    };

    return HttpResponse.json(mockRooms[roomIndex], { status: 200 });
  }),

  // POST /api/rooms/:id/leave
  // -> room.ts: leaveRoom(id)
  // -> 응답: 변경된 Room
  http.post("/api/rooms/:id/leave", ({ params }) => {
    const { id } = params;
    const roomIndex = mockRooms.findIndex((r) => r._id === id);

    if (roomIndex === -1) {
      return HttpResponse.json(
        { message: "Room not found" },
        { status: 404 }
      );
    }

    const room = mockRooms[roomIndex];
    const participants = (room.participants ?? []).filter((p) =>
      typeof p === "string"
        ? p !== CURRENT_USER_ID
        : p._id !== CURRENT_USER_ID
    );

    mockRooms[roomIndex] = {
      ...room,
      participants,
    };

    return HttpResponse.json(mockRooms[roomIndex], { status: 200 });
  }),
];
