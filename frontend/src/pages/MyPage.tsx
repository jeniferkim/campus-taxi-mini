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
      const res = await axiosInstance.get<{ rooms: Room[] }>("/rooms", {
        params: {
          participant: user._id, // 내가 만든/참여한 방만
          _ts: Date.now(),
        },
        withCredentials: true,
      });

      setMyRooms(res.data.rooms); // 항상 배열만 상태에 저장
    };

    fetchMyRooms();
  }, [user?._id]);

  if (!user) {
    return <div className="p-4">로그인이 필요합니다.</div>;
  }

  // hostId / participants 정규화 헬퍼
  const getHostId = (room: Room): string | undefined => {
    if (!room.hostId) return undefined;
    return typeof room.hostId === "string"
      ? room.hostId
      : room.hostId._id;
  };

  const isHostRoom = (room: Room) => getHostId(room) === user._id;

  const isJoinedRoom = (room: Room) => {
    const joined = room.participants?.some((p: any) =>
      typeof p === "string" ? p === user._id : p._id === user._id
    );
    return joined ?? false;
  };

  const hostingCount = myRooms.filter(isHostRoom).length;
  const joinedCount = myRooms.filter(
    (room) => isJoinedRoom(room) && !isHostRoom(room)
  ).length;

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      {/* ⭐ 프로필 카드 */}
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

        {/* 통계 카드 */}
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

      {/* ⭐ 내가 참여한 방 목록 */}
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
                        className={host ? "text-green-600" : "text-blue-600"}
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
