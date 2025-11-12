import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useCreateRoom from "../hooks/mutations/useCreateRoom";
import useToast from "../hooks/useToast";

export default function CreateRoomPage() {
  const [title, setTitle] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState(""); // "2025-11-13T09:30"
  const [maxPassenger, setMaxPassenger] = useState(4);

  const [params] = useSearchParams();
  const currentFilter = {
    departure: params.get("departure") || undefined,
    destination: params.get("destination") || undefined,
  };

  const { mutateAsync } = useCreateRoom(currentFilter);
  const nav = useNavigate();
  const { show } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutateAsync({
      title,
      departure,
      destination,
      departureTime: new Date(departureTime).toISOString(),
      maxPassenger: Number(maxPassenger),
    });
    show("방이 생성되었습니다.");
    // 목록으로 이동(현재 필터 유지)
    const q = new URLSearchParams();
    if (currentFilter.departure)   q.set("departure", currentFilter.departure);
    if (currentFilter.destination) q.set("destination", currentFilter.destination);
    nav({ pathname: "/", search: q.toString() ? `?${q.toString()}` : "" });
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto p-4 flex flex-col gap-3">
      <h2 className="text-xl font-bold mb-2">방 만들기</h2>
      <input className="border p-2 rounded" placeholder="제목" value={title} onChange={e=>setTitle(e.target.value)} />
      <input className="border p-2 rounded" placeholder="출발지" value={departure} onChange={e=>setDeparture(e.target.value)} />
      <input className="border p-2 rounded" placeholder="도착지" value={destination} onChange={e=>setDestination(e.target.value)} />
      <input className="border p-2 rounded" type="datetime-local" value={departureTime} onChange={e=>setDepartureTime(e.target.value)} />
      <input className="border p-2 rounded" type="number" min={2} max={8} value={maxPassenger} onChange={e=>setMaxPassenger(+e.target.value)} />
      <button className="bg-black text-white p-2 rounded">생성</button>
    </form>
  );
}
