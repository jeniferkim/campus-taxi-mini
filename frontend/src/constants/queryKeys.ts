export const QK = {
  rooms: "rooms",          // 리스트
  roomDetail: "roomDetail" // 상세
} as const;

// 방 목록 캐시 키 (필터 포함)
export const roomsKey = (filter: { departure?: string; destination?: string } = {}) =>
  ["rooms", { departure: filter.departure || "", destination: filter.destination || "" }] as const;

// rooms 전체(필터 불문) 캐시 무효화용 베이스 키
export const roomsBaseKey = ["rooms"] as const;
