// src/hooks/mutations/useCreateRoom.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoom } from "../../apis/room";
import { QK } from "../../constants/queryKeys";

type NewRoom = {
  title: string;
  departure: string;
  destination: string;
  departureTime: string; // ISO
  maxPassenger: number;
};

type Room = NewRoom & {
  _id: string;
  participants: Array<string | { _id: string }>;
  createdAt: string;
  __optimistic?: boolean;
};

// 필터 정규화: 항상 같은 모양으로 맞추기
const normalizeFilter = (filter: { departure?: string; destination?: string }) => ({
  departure: (filter.departure ?? "").trim(),
  destination: (filter.destination ?? "").trim(),
});

export default function useCreateRoom(currentFilter: { departure?: string; destination?: string }) {
  const queryClient = useQueryClient();
  const normalized = normalizeFilter(currentFilter);

  return useMutation({
    mutationFn: (payload: NewRoom) =>
      createRoom(payload).then((r) => r.data),

    // 낙관적 업데이트
    onMutate: async (payload) => {
      const key = [QK.rooms, normalized] as const;

      await queryClient.cancelQueries({ queryKey: key });

      const prev = (queryClient.getQueryData<Room[]>(key) || []).slice();

      const optimistic: Room = {
        _id: `tmp-${Date.now()}`,
        ...payload,
        departureTime: payload.departureTime,
        participants: [],
        createdAt: new Date().toISOString(),
        __optimistic: true,
      };

      queryClient.setQueryData<Room[]>(key, [optimistic, ...prev]);

      return { key, prev };
    },

    // 에러 시 롤백
    onError: (_err, _payload, ctx) => {
      if (ctx?.key) {
        queryClient.setQueryData<Room[]>(ctx.key, ctx.prev);
      }
    },

    // 성공/실패 상관 없이 항상 서버 데이터로 동기화
    onSettled: async () => {
      // 현재 필터 + 다른 필터들까지 포함해서 rooms 전부 새로고침
      await queryClient.invalidateQueries({ queryKey: [QK.rooms] });
    },
  });
}