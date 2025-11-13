import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiPlus, FiMapPin, FiClock, FiUsers } from "react-icons/fi";
import useCreateRoom from "../hooks/mutations/useCreateRoom";
import useToast from "../hooks/useToast";

export default function CreateRoomPage() {
  const [title, setTitle] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [maxPassenger, setMaxPassenger] = useState(4);

  const [params] = useSearchParams();
  const currentFilter = {
    departure: params.get("departure") || undefined,
    destination: params.get("destination") || undefined,
  };

  const { mutateAsync } = useCreateRoom(currentFilter);
  const nav = useNavigate();
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 필수 입력값 검증
    if (!title.trim() || !departure.trim() || !destination.trim() || !departureTime) {
      toast.error("방 제목, 출발지, 도착지, 출발 시간을 모두 입력해 주세요.");
      return;
    }

    try {
      // 2. 방 생성 API 호출
      await mutateAsync({
        title,
        departure,
        destination,
        departureTime: new Date(departureTime).toISOString(),
        maxPassenger: Number(maxPassenger),
      });

      // 3. 성공 토스트
      toast.success("방이 성공적으로 생성되었습니다.");

      // 4. 목록으로 이동 (현재 검색 필터 유지)
      const q = new URLSearchParams();
      if (currentFilter.departure) q.set("departure", currentFilter.departure);
      if (currentFilter.destination) q.set("destination", currentFilter.destination);

      nav({
        pathname: "/",
        search: q.toString() ? `?${q.toString()}` : "",
      });
    } catch (error) {
      // 5. 실패 시 토스트만 (이동 X)
      console.error(error);
      toast.error("방 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };


  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-green-600">
        {/* 상단 아이콘 + 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-linear-to-br from-green-600 to-emerald-600 p-4 rounded-full mb-4">
            <FiPlus className="text-white text-4xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            새 택시 방 만들기
          </h2>
          <p className="text-gray-600">동승할 사람들을 모집해보세요</p>
        </div>

        {/* 폼 영역 */}
        <form onSubmit={submit} className="space-y-6">
          {/* 방 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방 제목
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              placeholder="예: 대전역 가는 택시 같이 타요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 출발지 / 도착지 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <FiMapPin className="text-green-600" />
                <span>출발지</span>
              </label>
              {/* 텍스트 입력 그대로 유지 (기능 동일) */}
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                placeholder="예: 기숙사, 정문 등"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <FiMapPin className="text-emerald-600" />
                <span>도착지</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                placeholder="예: 대전역, 가천대 등"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          {/* 출발 시간 / 최대 인원 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <FiClock className="text-teal-600" />
                <span>출발 시간</span>
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <FiUsers className="text-blue-600" />
                <span>최대 인원</span>
              </label>
              <input
                type="number"
                min={2}
                max={8}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                value={maxPassenger}
                onChange={(e) => setMaxPassenger(+e.target.value)}
              />
            </div>
          </div>

          {/* Tip 박스 */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">💡 Tip</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 출발 시간을 여유있게 설정하면 더 많은 사람들이 참여할 수 있어요</li>
              <li>• 구체적인 위치를 제목에 포함하면 좋아요 (예: &quot;KAIST 정문 앞&quot;)</li>
            </ul>
          </div>

          {/* 버튼 영역 */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg" 
            >
              방 만들기
            </button>
            <button
              type="button"
              onClick={() => nav(-1)}
              className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}