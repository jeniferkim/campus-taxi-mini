import { useEffect, useState } from "react";
import { getRoomList, joinRoom, leaveRoom } from "../apis/room";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function RoomListPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const { user } = useAuth();

  const load = async () => {
    const res = await getRoomList();
    setRooms(res.data);
  };

  useEffect(() => { load(); }, []);

  const inRoom = (room:any) => user && room.participants?.some((id:string)=>id===user._id || id?._id===user._id);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">🚕 방 목록</h2>
        <Link to="/create" className="bg-black text-white px-3 py-1 rounded">방 만들기</Link>
      </div>
      <div className="flex flex-col gap-3">
        {rooms.map((room) => (
          <div key={room._id} className="border p-3 rounded">
            <div className="font-semibold">{room.title}</div>
            <div className="text-sm text-gray-600">{room.departure} → {room.destination}</div>
            <div className="text-sm">출발: {new Date(room.departureTime).toLocaleString()}</div>
            <div className="flex gap-2 mt-2">
              {!inRoom(room) ? (
                <button onClick={async ()=>{ await joinRoom(room._id); await load(); }} className="px-3 py-1 rounded bg-blue-600 text-white">참여</button>
              ) : (
                <button onClick={async ()=>{ await leaveRoom(room._id); await load(); }} className="px-3 py-1 rounded bg-red-600 text-white">나가기</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
