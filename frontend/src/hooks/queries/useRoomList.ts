import { useQuery } from "@tanstack/react-query";
import { getRoomList } from "../../apis/room";
import { QK } from "../../constants/queryKeys";

type Params = { departure?: string; destination?: string };

export default function useRoomList(params: Params) {
  const { departure, destination } = params;
  return useQuery({
    queryKey: [QK.rooms, { departure: departure || "", destination: destination || "" }],
    queryFn: async () => {
      const res = await getRoomList(
        departure, 
        destination,
      );
      return res.data;
    },
    staleTime: 10_000,
    gcTime: 60_000,
  });
}
