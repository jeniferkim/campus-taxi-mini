import { useState } from "react";
import { getRoomList, joinRoom, leaveRoom } from "../apis/room";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function RoomListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();

  // URL ↔ 상태 동기화 (기존 로직 유지)
  const [departure, setDeparture] = useState(params.get("departure") ?? "");
  const [destination, setDestination] = useState(params.get("destination") ?? "");

  // 현재 필터를 키에 포함해 캐시 분리
  const queryKey = ["rooms", { departure: departure || "", destination: destination || "" }];

  // 리스트 쿼리
  const { data: rooms = [], isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getRoomList(
        departure.trim() || undefined,
        destination.trim() || undefined
      );
      return res.data as any[];
    },
    staleTime: 10_000,
    gcTime: 60_000,
  });

  // 참여/나가기 → 성공 시 현재 키 무효화(자동 새로고침)
  const qc = useQueryClient();

  const joinMut = useMutation({
    mutationFn: (id: string) => joinRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const leaveMut = useMutation({
    mutationFn: (id: string) => leaveRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (departure) next.set("departure", departure);
    if (destination) next.set("destination", destination);
    setParams(next); // URL 동기화(상태는 이미 반영되어 있어 쿼리도 즉시 재요청됨)
  };

  const inRoom = (room: any) =>
    user && room.participants?.some((id: string) => id === user._id || id?._id === user._id);

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
          onChange={(e) => setDeparture(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input
          placeholder="도착지"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button className="px-3 py-2 rounded bg-blue-600 text-white">검색</button>
      </form>

      {isFetching && (
        <div className="text-sm text-gray-500 mb-2">불러오는 중…</div>
      )}

      <div className="flex flex-col gap-3">
        {rooms.map((room: any) => (
          <div key={room._id} className="border p-3 rounded">
            <div className="font-semibold">{room.title}</div>
            <div className="text-sm text-gray-600">
              {room.departure} → {room.destination}
            </div>
            <div className="text-sm">
              출발: {new Date(room.departureTime).toLocaleString()}
            </div>
            <div className="flex gap-2 mt-2">
              {!inRoom(room) ? (
                <button
                  onClick={() => joinMut.mutate(room._id)}
                  className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
                  disabled={joinMut.isPending}
                >
                  {joinMut.isPending ? "참여 중..." : "참여"}
                </button>
              ) : (
                <button
                  onClick={() => leaveMut.mutate(room._id)}
                  className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-60"
                  disabled={leaveMut.isPending}
                >
                  {leaveMut.isPending ? "나가는 중..." : "나가기"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
