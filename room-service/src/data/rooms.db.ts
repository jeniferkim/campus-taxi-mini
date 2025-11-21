// // 임시 mock 데이터 (Mongo 도입 전)

// export type Room = {
//   _id: string;
//   title: string;
//   departure: string;
//   destination: string;
//   departureTime: string;
//   maxPassenger: number;
//   participants: string[];
//   hostId: string;
// };

// export const rooms: Room[] = [
//   {
//     _id: "1",
//     title: "카이스트 → 대전역",
//     departure: "카이스트",
//     destination: "대전역",
//     departureTime: "2025-11-15T10:00:00.000Z",
//     maxPassenger: 4,
//     participants: ["me"],
//     hostId: "me"
//   },
//   {
//     _id: "2",
//     title: "카이스트 → 유성온천",
//     departure: "카이스트",
//     destination: "유성온천",
//     departureTime: "2025-11-20T18:00:00.000Z",
//     maxPassenger: 3,
//     participants: ["me"],
//     hostId: "me"
//   }
// ];

// 인메모리 rooms 배열 + create/join/leave
import { v4 as uuidv4 } from "uuid";

export type Room = {
  _id: string;
  title: string;
  departure: string;
  destination: string;
  departureTime: string;
  maxPassenger: number;
  hostId: string;      // 방장
  participants: string[]; // userId 목록
};

export const rooms: Room[] = [];

// 방 생성
export function createRoom(params: {
  title: string;
  departure: string;
  destination: string;
  departureTime: string;
  maxPassenger: number;
  hostId: string; // 생성자 userId
}): Room {
  const { title, departure, destination, departureTime, maxPassenger, hostId } =
    params;

  const room: Room = {
    _id: uuidv4(),
    title,
    departure,
    destination,
    departureTime,
    maxPassenger,
    hostId,
    participants: [hostId], // 생성자가 자동 참여
  };

  rooms.push(room);
  return room;
}

// 참여
export function joinRoom(roomId: string, userId: string): Room | null {
  const room = rooms.find((r) => r._id === roomId);
  if (!room) return null;

  // 이미 참여 중이면 그대로 반환
  if (room.participants.includes(userId)) {
    return room;
  }

  // 정원 초과 체크
  if (room.participants.length >= room.maxPassenger) {
    return room; // 또는 라우터에서 409로 처리하도록 throw 해도 됨
  }

  room.participants.push(userId);
  return room;
}

// 나가기
export function leaveRoom(roomId: string, userId: string): Room | null {
  const room = rooms.find((r) => r._id === roomId);
  if (!room) return null;

  room.participants = room.participants.filter((id) => id !== userId);

  return room;
}
