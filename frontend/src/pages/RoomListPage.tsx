import { useEffect, useState } from "react";
import { getRoomList, joinRoom, leaveRoom } from "../apis/room";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoomListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [rooms, setRooms] = useState<any[]>([]);

  // URL ↔ 상태 동기화
  const [departure, setDeparture] = useState(params.get("departure") ?? "");
  const [destination, setDestination] = useState(params.get("destination") ?? "");

  const load = async () => {
    const res = await getRoomList(
      departure.trim() || undefined,
      destination.trim() || undefined
    );
    setRooms(res.data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [params.toString()]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (departure) next.set("departure", departure);
    if (destination) next.set("destination", destination);
    setParams(next);
  };

  const inRoom = (room:any) =>
    user && room.participants?.some((id:string)=> id===user._id || id?._id===user._id);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">🚕 방 목록</h2>
        <Link to="/create" className="bg-black text-white px-3 py-1 rounded">방 만들기</Link>
      </div>

      {/* 검색 폼 */}
      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          placeholder="출발지"
          value={departure}
          onChange={e=>setDeparture(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          placeholder="도착지"
          value={destination}
          onChange={e=>setDestination(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button className="px-3 py-2 rounded bg-blue-600 text-white">검색</button>
      </form>

      <div className="flex flex-col gap-3">
        {rooms.map((room) => (
          <div key={room._id} className="border p-3 rounded">
            <div className="font-semibold">{room.title}</div>
            <div className="text-sm text-gray-600">{room.departure} → {room.destination}</div>
            <div className="text-sm">출발: {new Date(room.departureTime).toLocaleString()}</div>
            <div className="flex gap-2 mt-2">
              {!inRoom(room) ? (
                <button
                  onClick={async ()=>{ await joinRoom(room._id); await load(); }}
                  className="px-3 py-1 rounded bg-blue-600 text-white"
                >참여</button>
              ) : (
                <button
                  onClick={async ()=>{ await leaveRoom(room._id); await load(); }}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >나가기</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
