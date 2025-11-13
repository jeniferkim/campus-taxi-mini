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


export default function useCreateRoom(currentFilter: { departure?: string; destination?: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NewRoom) => createRoom(payload).then(r => r.data),
    onMutate: async (payload) => {
      // 필터 키
      const key = [QK.rooms, { departure: currentFilter.departure || "", destination: currentFilter.destination || "" }];

      await queryClient.cancelQueries({ queryKey: key });

      // 이전 스냅샷
      const prev = queryClient.getQueryData<any[]>(key) || [];

      // 낙관적 항목(간이)
      const optimistic = {
        _id: `tmp-${Date.now()}`,
        ...payload,
        departureTime: payload.departureTime,
        participants: [],
        createdAt: new Date().toISOString(),
        __optimistic: true,
      };

      queryClient.setQueryData<any[]>(key, [optimistic, ...prev]);

      return { key, prev };
    },
    onSuccess: async (_, __, ctx) => {
      // 성공 시 해당 필터 리스트 무효화 → 서버 최신값으로 교체
      if (ctx?.key) await queryClient.invalidateQueries({ queryKey: ctx.key });
    },
    onError: (_err, _payload, ctx) => {
      // 롤백
      if (ctx?.key) queryClient.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: async (_data, _err, _payload, ctx) => {
      if (ctx?.key) await queryClient.invalidateQueries({ queryKey: ctx.key });
    },
  });
}
