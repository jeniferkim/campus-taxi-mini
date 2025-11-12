import { useEffect, useState } from "react";
import { getRoomList } from "../apis/room";

export default function RoomListPage() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    getRoomList().then((res) => setRooms(res.data));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🚕 방 목록</h2>
      {rooms.map((room) => (
        <div key={room._id} className="border p-2 mb-2 rounded">
          <div>{room.title}</div>
          <div>{room.departure} → {room.destination}</div>
          <div>출발: {new Date(room.departureTime).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
