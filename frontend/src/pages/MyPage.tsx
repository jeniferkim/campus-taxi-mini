import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiMapPin, FiCalendar } from "react-icons/fi";
import type { Room } from "../types/room";
import { axiosInstance } from "../apis/axios";

export default function MyPage() {
  const { user } = useAuth();
  const [myRooms, setMyRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!user?._id) return;

    const fetchMyRooms = async () => {
      const res = await axiosInstance.get("/rooms", {
        params: {
          participant: user._id,
          _ts: Date.now(),
        },
        withCredentials: true,
      });

      const payload = res.data as any;

      // 서버가 배열 그대로 내려줄 때
      if (Array.isArray(payload)) {
        setMyRooms(payload);
        return;
      }

      // 서버가 { rooms: [...] } 형태일 때
      if (Array.isArray(payload.rooms)) {
        setMyRooms(payload.rooms);
        return;
      }

      setMyRooms([]);
    };

    fetchMyRooms();
  }, [user?._id]);

  if (!user) return <div className="p-4">로그인이 필요합니다.</div>;

  // hostId / participants 정규화
  // 공통 id 추출 헬퍼
  const extractId = (x: any) => (typeof x === "string" ? x : x?._id);

  const isHostRoom = (room: Room) => extractId(room.hostId) === user._id;

  const isJoinedRoom = (room: Room) =>
    room.participants?.some((p: any) => extractId(p) === user._id) ?? false;

  const hostingCount = myRooms.filter(isHostRoom).length;
  const joinedCount = myRooms.filter(
    (room) => isJoinedRoom(room) && !isHostRoom(room)
  ).length;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* --- 프로필 카드 --- */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-green-600">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8">
          <div className="flex items-center space-x-6">
            <div className="bg-white p-6 rounded-full">
              <FiUser className="text-green-600 text-5xl" />
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
              <p className="text-green-100">{user._id}</p>
            </div>
          </div>
        </div>

        {/* --- 통계 카드 --- */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 text-center">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {hostingCount}
              </div>
              <div className="text-gray-600 font-medium">만든 방</div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200 text-center">
              <div className="text-4xl font-bold text-emerald-700 mb-2">
                {joinedCount}
              </div>
              <div className="text-gray-600 font-medium">참여한 방</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 내가 참여한 방 목록 --- */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
          <FiCalendar className="text-emerald-600" />
          <span>내 택시 방</span>
        </h2>

        {myRooms.length === 0 ? (
          <div className="text-gray-500">참여한 방이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {myRooms.map((room) => {
              const host = isHostRoom(room);

              return (
                <div
                  key={room._id}
                  className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-full ${
                        host ? "bg-green-100" : "bg-blue-100"
                      }`}
                    >
                      <FiMapPin
                        className={
                          host ? "text-green-600" : "text-blue-600"
                        }
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {room.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {room.departure} → {room.destination}
                      </p>
                      <p className="text-xs text-gray-500">
                        출발:{" "}
                        {new Date(room.departureTime).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      host
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {host ? "호스트" : "참여자"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
