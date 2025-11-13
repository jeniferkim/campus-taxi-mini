const RoomDetailPage = () => {
  const room = {
    id: 1,
    title: '대전역 가는 택시 같이 타요',
    departure: 'KAIST',
    destination: '대전역',
    departureTime: '2024-03-15T14:30',
    currentPassenger: 2,
    maxPassenger: 4,
    hostName: '김철수',
    participants: ['김철수', '이영희']
  };
  
  return (
    <Layout currentUser={{ name: '홍길동' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-green-600">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{room.title}</h1>
            <div className="flex items-center space-x-4 text-green-100">
              <span className="flex items-center space-x-1">
                <FiUsers />
                <span>{room.currentPassenger}/{room.maxPassenger}명</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <FiUser />
                <span>호스트: {room.hostName}</span>
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Route Info */}
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FiMapPin className="text-green-600" />
                <span>이동 경로</span>
              </h2>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-green-700">{room.departure}</div>
                  <div className="text-sm text-gray-600 mt-1">출발지</div>
                </div>
                <div className="px-6">
                  <div className="text-4xl text-green-600">→</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-emerald-700">{room.destination}</div>
                  <div className="text-sm text-gray-600 mt-1">도착지</div>
                </div>
              </div>
            </div>
            
            {/* Time Info */}
            <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                <FiClock className="text-emerald-600" />
                <span>출발 시간</span>
              </h2>
              <div className="text-2xl font-bold text-emerald-700">
                {new Date(room.departureTime).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            {/* Participants */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FiUsers className="text-teal-600" />
                <span>참여자 ({room.participants.length}명)</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {room.participants.map((participant, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="bg-green-100 p-2 rounded-full">
                      <FiUser className="text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">{participant}</span>
                    {idx === 0 && (
                      <span className="ml-auto px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                        호스트
                      </span>
                    )}
                  </div>
                ))}
                {[...Array(room.maxPassenger - room.currentPassenger)].map((_, idx) => (
                  <div key={`empty-${idx}`} className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300">
                    <div className="bg-gray-200 p-2 rounded-full">
                      <FiUser className="text-gray-400" />
                    </div>
                    <span className="text-gray-400">빈 자리</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg">
                참여하기
              </button>
              <button className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all">
                돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
