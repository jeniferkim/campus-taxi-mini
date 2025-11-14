// /api/rooms 로 GET 호출해서 방 목록 카드 렌더링
// 참여/나가기 시 invalidateQueries(["rooms"]) 로 목록 자동 갱신 -> 새로고침 없이 바로 반영
// 검색폼은 출발지/도착지 입력 후 검색 버튼 누르면 URL 쿼리(?departure=&destination=)와 같이 동기화

import { useMemo, useState } from "react";
import {
  data,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { getRoomList, joinRoom, leaveRoom } from "../apis/room";
import { useAuth } from "../context/AuthContext";
import useToast from "../hooks/useToast";
import { FiClock, FiMapPin, FiUser } from "react-icons/fi";
import { QK } from "../constants/queryKeys";


type Room = {
  _id: string;
  title: string;
  departure: string;
  destination: string;
  departureTime: string;
  maxPassenger: number;
  participants?: Array<string | { _id: string }>;
  hostId?: string | { _id: string; name?: string; username?: string };
  hostName?: string;
};

export default function RoomListPage() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  const isLoggedIn = !!user;

  // 1) URL → 검색 인풋 초기값
  const [departureInput, setDepartureInput] = useState(
    params.get("departure") ?? ""
  );
  const [destinationInput, setDestinationInput] = useState(
    params.get("destination") ?? ""
  );

  // 2) 실제 API 호출에 사용하는 필터 상태
  const [filter, setFilter] = useState(() => ({
    departure: (params.get("departure") ?? "").trim(),
    destination: (params.get("destination") ?? "").trim(),
  }));

  // queryKey용 정규화 필터
  const currentFilter = useMemo(
    () => ({
      departure: filter.departure.trim(),
      destination: filter.destination.trim(),
    }),
    [filter]
  );

  // 3) 방 목록 조회 (TanStack Query)
  // 캐시에는 항상 Room[]을 넣는다
  //  여기에서 QK.rooms + currentFilter를 queryKey로 사용
  const { data: rooms = [], isLoading, isError } = useQuery<Room[]>({
    queryKey: [QK.rooms, currentFilter],
    queryFn: async () => {
      // getRoomList 는 axiosInstance.get(...)을 반환하니까~
      const res = await getRoomList(
        currentFilter.departure || undefined,
        currentFilter.destination || undefined
      );
      
      const payload = res.data as any;

      // 서버가 그냥 배열을 내려주는 경우: [ {...room} ]
      if (Array.isArray(payload)) {
        return payload as Room[];
      }
    
      // 서버가 { rooms: [...] } 형태로 내려주는 경우
      if (Array.isArray(payload.rooms)) {
        return (payload as any).rooms as Room[];
      }

      // 그 외는 빈 배열
      return [];
    },
  });

  // 공통 id 추출 헬퍼
  const getId = (val: string | { _id: string } | undefined | null) => {
    if (!val) return undefined;
    return typeof val === "string" ? val : val._id;
  };

  const myId = getId(user as any);

  // 현재 로그인 유저가 방에 참여중인지
  const inRoom = (room: Room) => {
    if (!user) return false;
    return room.participants?.some((p) => {
      if (typeof p === "string") return p === (user as any)._id;
      return p?._id === (user as any)._id;
    });
  };

  const currentCount = (room: Room) => room.participants?.length ?? 0;
  const isFull = (room: Room) => currentCount(room) >= room.maxPassenger;

  // 참여 / 나가기 mutation
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
      queryClient.invalidateQueries({ queryKey: [QK.rooms] });
    },
    onError: () => {
      toast.error("방 나가기에 실패했어요. 다시 시도해 주세요.");
    },
  });

  // 4) 검색 폼 submit → URL + 필터 상태 업데이터
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const nextDeparture = departureInput.trim();
    const nextDestination = destinationInput.trim();

    // URL 쿼리 업데이트
    const next = new URLSearchParams();
    if (nextDeparture) next.set("departure", nextDeparture);
    if (nextDestination) next.set("destination", nextDestination);
    setParams(next);

    // 실제 필터 상태 업데이트 → queryKey 변경 → refetch
    setFilter({
      departure: nextDeparture,
      destination: nextDestination,
    });
  };

  // 요약 텍스트
  const summaryText = useMemo(() => {
    if (!currentFilter.departure && !currentFilter.destination)
      return "전체 방 목록";
    if (currentFilter.departure && currentFilter.destination) {
      return `${currentFilter.departure} → ${currentFilter.destination} 방 목록`;
    }
    if (currentFilter.departure)
      return `${currentFilter.departure} 출발 방 목록`;
    return `${currentFilter.destination} 도착 방 목록`;
  }, [currentFilter.departure, currentFilter.destination]);

  // 참여하기 버튼 클릭 핸들러
  const handleJoin = (room: Room) => {
    if (!isLoggedIn) {
      toast.info("로그인 후 이용해 주세요.");
      nav("/login", {
        state: {
          from: location.pathname + location.search,
        },
      });
      return;
    }

    const hostId = getId(room.hostId as any);
    const participants = (room.participants ?? []).map((p) =>
      getId(p as any)
    );
    const headCount = participants.filter(Boolean).length;

    const isHost = myId && hostId === myId;
    const joined = myId && participants.includes(myId);
    const full = headCount >= room.maxPassenger;

    if (isHost) {
      toast.info("내가 만든 방이에요.");
      return;
    }

    if (joined) {
      toast.info("이미 참여 중인 방이에요.");
      return;
    }

    if (full) {
      toast.info("이미 인원이 가득 찼어요.");
      return;
    }

    joinMutation.mutate(room._id);
  };

  // 나가기 버튼 클릭 핸들러
  const handleLeave = (room: Room) => {
    if (!isLoggedIn) {
      toast.info("로그인 후 이용해 주세요.");
      return;
    }
    leaveMutation.mutate(room._id);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* 상단 헤더 */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🚕</span> <span>방 목록</span>
          </h2>
          <p className="text-sm text-gray-600 mt-1">{summaryText}</p>
        </div>

        <Link
          to={isLoggedIn ? "/create" : "/login"}
          className="px-4 py-2 rounded-md bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          {isLoggedIn ? "방 만들기" : "로그인 후 방 만들기"}
        </Link>
      </header>

      {/* 검색 폼 */}
      <form
        onSubmit={onSearch}
        className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-md"
      >
        <input
          placeholder="출발지"
          value={departureInput}
          onChange={(e) => setDepartureInput(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-1 min-w-[120px]"
        />
        <input
          placeholder="도착지"
          value={destinationInput}
          onChange={(e) => setDestinationInput(e.target.value)}
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
        <div className="text-center text-gray-500 py-10">
          방 목록을 불러오는 중...
        </div>
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
          {isLoggedIn
            ? "새 방을 만들어보세요!"
            : "로그인 후 방을 만들어보세요!"}
        </div>
      )}

      {/* 방 카드 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const joined = inRoom(room);
          const full = isFull(room);
          const current = currentCount(room);
          const hostId = getId(room.hostId as any);
          const isHost = myId && hostId === myId;

          const hostDisplayName =
            room.hostName ||
            (typeof room.hostId === "object" &&
              (room.hostId.name || room.hostId.username)) ||
            "호스트";

          const joiningThis = joinMutation.isPending;
          const leavingThis = leaveMutation.isPending;

          const borderColor = isHost
            ? "border-green-500"
            : joined
            ? "border-emerald-500"
            : full
            ? "border-red-500"
            : "border-blue-500";

          return (
            <div
              key={room._id}
              className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border-t-4 cursor-pointer group ${borderColor}`}
            >
              <div className="p-6">
                {/* 제목 + 참여/정원 태그 */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                      {room.title}
                    </h3>
                    {isHost && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        내가 만든 방
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                      {current}/{room.maxPassenger}명
                    </span>

                    {joined && !isHost && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        참여중
                      </span>
                    )}

                    {full && !joined && !isHost && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        정원 마감
                      </span>
                    )}
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="space-y-3 mb-4 text-gray-700">
                  <div className="flex items-center space-x-2">
                    <FiMapPin className="text-green-600" />
                    <span className="text-sm">{room.departure}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-medium">
                      {room.destination}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FiClock className="text-emerald-600" />
                    <span className="text-sm">
                      {new Date(room.departureTime).toLocaleString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FiUser className="text-teal-600" />
                    <span className="text-sm">{hostDisplayName}</span>
                  </div>
                </div>

                {/* 버튼 영역 */}
                <div className="flex justify-end gap-2 mt-2">
                  {/* 로그인 안됨 */}
                  {!isLoggedIn && (
                    <button
                      type="button"
                      onClick={() =>
                        nav("/login", {
                          state: {
                            from: location.pathname + location.search,
                          },
                        })
                      }
                      className="w-full text-center py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-all"
                    >
                      로그인 후 참여
                    </button>
                  )}

                  {/* 로그인 됨 */}
                  {isLoggedIn && (
                    <>
                      {/* 이미 참여한 경우 (방장 제외) → 나가기 */}
                      {joined && !isHost && (
                        <button
                          type="button"
                          disabled={leavingThis}
                          onClick={() => handleLeave(room)}
                          className="w-full py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all disabled:bg-red-300 disabled:cursor-not-allowed"
                        >
                          나가기
                        </button>
                      )}

                      {/* 참여 안했고 정원이 남은 상태 → 참여하기 */}
                      {!joined && !isHost && (
                        <button
                          type="button"
                          disabled={joiningThis || full}
                          onClick={() => handleJoin(room)}
                          className={`w-full py-2 rounded-lg text-sm font-medium text-white transition-all ${
                            full
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {full ? "정원 초과" : "참여하기"}
                        </button>
                      )}

                      {/* 내가 만든 방일 때 */}
                      {isHost && (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 cursor-not-allowed"
                        >
                          내가 만든 방
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
