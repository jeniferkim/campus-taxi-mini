import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getRoomList } from "../apis/room";

export default function MyPage() {
  const { user } = useAuth();
  const [myRooms, setMyRooms] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      const res = await getRoomList(undefined, undefined); // 기본 목록
      const resMine = await getRoomList(undefined, undefined); // 호환성 유지
      // participant 필터 사용
      const resByMe = await getRoomList(undefined, undefined);
      const r = await getRoomList(undefined, undefined);
    };
    // 간단히 participant 파라미터로 재요청
    (async () => {
      if (!user) return;
      const res = await fetch(`/api/rooms?participant=${user._id}`, { credentials: "include" });
      const data = await res.json();
      setMyRooms(data);
    })();
  }, [user]);

  if (!user) return <div className="p-4">로그인이 필요합니다.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">내 정보</h2>
      <div className="mb-4 border p-3 rounded">
        <div>이름: {user.name}</div>
        <div>아이디: {user._id}</div>
        <div>세션 유지: sid 쿠키</div>
      </div>

      <h3 className="text-lg font-semibold mb-2">내가 참여한 방</h3>
      <div className="flex flex-col gap-3">
        {myRooms.map(r => (
          <div key={r._id} className="border p-3 rounded">
            <div className="font-semibold">{r.title}</div>
            <div className="text-sm text-gray-600">{r.departure} → {r.destination}</div>
            <div className="text-sm">출발: {new Date(r.departureTime).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
