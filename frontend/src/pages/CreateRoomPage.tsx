import { useState } from "react";
import { postRoom } from "../apis/room";
import { useNavigate } from "react-router-dom";

export default function CreateRoomPage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState(""); // datetime-local
  const [maxPassenger, setMaxPassenger] = useState(4);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await postRoom({
      title,
      departure,
      destination,
      departureTime: new Date(departureTime).toISOString(),
      maxPassenger,
    });
    nav("/");
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-4 flex flex-col gap-3">
      <h2 className="text-xl font-bold mb-2">방 만들기</h2>
      <input placeholder="제목" value={title} onChange={(e)=>setTitle(e.target.value)} className="border p-2 rounded" />
      <input placeholder="출발지" value={departure} onChange={(e)=>setDeparture(e.target.value)} className="border p-2 rounded" />
      <input placeholder="도착지" value={destination} onChange={(e)=>setDestination(e.target.value)} className="border p-2 rounded" />
      <input type="datetime-local" value={departureTime} onChange={(e)=>setDepartureTime(e.target.value)} className="border p-2 rounded" />
      <input type="number" min={1} max={8} value={maxPassenger} onChange={(e)=>setMaxPassenger(Number(e.target.value))} className="border p-2 rounded" />
      <button className="bg-green-600 text-white p-2 rounded">생성</button>
    </form>
  );
}
