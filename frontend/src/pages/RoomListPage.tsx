// /api/rooms 로 GET 호출해서 방 목록 카드 렌더링
// 참여/나가기 시 invalidateQueries(["rooms"]) 로 목록 자동 갱신 -> 새로고침 없이 바로 반영
// 검색폼은 출발지/도착지 입력 후 검색 버튼 누르면 URL 쿼리(?depature=&destination=)와 같이 동기화

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getRoomList, joinRoom, leaveRoom } from "../apis/room";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast"; 

type Room = {
  _id: string;
  title: string;
  departure: string;
  destination: string;
  departureTime: string;
  maxPassenger: number;
  participants?: Array<string | { _id: string }>;
  hostId?: string | { _id: string };
};

export default function RoomListPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  // URL ↔ 검색폼 동기화
  const [departure, setDeparture] = useState(params.get("departure") ?? "");
  const [destination, setDestination] = useState(params.get("destination") ?? "");


  // TanStack Query로 방 목록 조회
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rooms", { departure, destination }],
    queryFn: () =>
      getRoomList(
        departure.trim() || undefined,
        destination.trim() || undefined
      ).then((res) => res.data.rooms),
  });

  

  const rooms = data ?? [];

  // 현재 로그인 유저가 방에 참여중인지
  const inRoom = (room: Room) => {
    if (!user) return false;
    return room.participants?.some((p) => {
      if (typeof p === "string") return p === user._id;
      return p?._id === user._id;
    });
  };

  const currentCount = (room: Room) => room.participants?.length ?? 0;
  const isFull = (room: Room) => currentCount(room) >= room.maxPassenger;

  //  참여 / 나가기 mutation
  const joinMutation = useMutation({
    mutationFn: (roomId: string) => joinRoom(roomId),
    onSuccess: () => {
      toast.success("방에 참여했어요.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      toast.error("방 참여에 실패했어요. 다시 시도해 주세요.");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (roomId: string) => leaveRoom(roomId),
    onSuccess: () => {
      toast.success("방에서 나왔어요.");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      toast.error("방 나가기에 실패했어요. 다시 시도해 주세요.");
    },
  });

  // 3) 검색 폼 submit → URL 쿼리 업데이트
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (departure.trim()) next.set("departure", departure.trim());
    if (destination.trim()) next.set("destination", destination.trim());
    setParams(next);
    // queryKey 에 departure/destination 이 들어가 있어서
    // 상태만 바꿔도 자동으로 refetch 됨
  };


    const isLoggedIn = !!user;

    const summaryText = useMemo(() => {
    if (!departure && !destination) return "전체 방 목록";
    if (departure && destination) {
      return `${departure} → ${destination} 방 목록`;
    }
    if (departure) return `${departure} 출발 방 목록`;
    return `${destination} 도착 방 목록`;
  }, [departure, destination]);



  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* 상단 헤더 */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🚕</span> <span>방 목록</span>
            <p className="text-sm text-gray-600 mt-1">{summaryText}</p>
          </h2>
        </div>

        <Link
          to={isLoggedIn ? "/create" : "/login"}
          className="px-4 py-2 rounded-md bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          {isLoggedIn ? "방 만들기" : "로그인 후 방 만들기"}
        </Link>
      </header>


      {/* 검색 폼 */}
      <form onSubmit={onSearch} className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-md">
        <input
          placeholder="출발지"
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1 min-w-[120px]"
        />
        <input
          placeholder="도착지"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1 min-w-[120px]"
        />
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
          type="submit"
        >
          검색
        </button>
      </form>


      {/* 상태 처리 */}
      {isLoading && (
        <div className="text-center text-gray-500 py-10">방 목록을 불러오는 중...</div>
      )}

      {isError && !isLoading && (
        <div className="text-center text-red-500 py-10">
          방 목록을 불러오는 중 오류가 발생했어요.
        </div>
      )}

      {!isLoading && !isError && rooms.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          조건에 맞는 방이 없습니다.  
          <br />
          {isLoggedIn ? "새 방을 만들어보세요!" : "로그인 후 방을 만들어보세요!"}
        </div>
      )}


      {/* 방 카드 리스트 */}
      <div className="flex flex-col gap-3">
        {rooms.map((room) => {
          const joined = inRoom(room);
          const full = isFull(room);

          return (
            <div
              key={room._id}
              className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 shadow-sm bg-white"
            >
              {/* 상단 타이틀 + 태그 */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-semibold text-lg">{room.title}</div>
                  <div className="text-sm text-gray-600">
                    {room.departure} → {room.destination}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 text-xs">
                  {joined && (
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                      참여중
                    </span>
                  )}
                  {full && (
                    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                      정원 마감
                    </span>
                  )}
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="text-sm text-gray-700 flex flex-wrap gap-4">
                <div>
                  <span className="font-medium">출발 시간&nbsp;</span>
                  {new Date(room.departureTime).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">인원&nbsp;</span>
                  {currentCount(room)} / {room.maxPassenger}
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end gap-2 mt-2">
                {!isLoggedIn && (
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    로그인 후 참여
                  </Link>
                )}

                {isLoggedIn && !joined && (
                  <button
                    type="button"
                    disabled={joinMutation.isPending || full}
                    onClick={() => joinMutation.mutate(room._id)}
                    className={`px-4 py-1.5 rounded-md text-sm text-white transition-colors ${
                      full
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {full ? "정원 초과" : "참여하기"}
                  </button>
                )}

                {isLoggedIn && joined && (
                  <button
                    type="button"
                    disabled={leaveMutation.isPending}
                    onClick={() => leaveMutation.mutate(room._id)}
                    className="px-4 py-1.5 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    나가기
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
