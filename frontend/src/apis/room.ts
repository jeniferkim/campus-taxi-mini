import type { Room } from "../types/room";
import { axiosInstance } from "./axios";

export const getRoomList = (departure?: string, destination?: string) =>
  axiosInstance.get<{ rooms: Room[] }>("/rooms/", { // 무조건 /rooms/
    params: { 
      departure, 
      destination,
      _ts: Date.now(), // 캐시 우회를 위한 타임스탬프
      },
  });

export const createRoom = (data: {
  title: string;
  departure: string;
  destination: string;
  departureTime: string;  
  maxPassenger: number;
}) => axiosInstance.post("/rooms/", data); // 무조건 /rooms/

export const joinRoom = (id: string) => axiosInstance.post(`/rooms/${id}/join`);
export const leaveRoom = (id: string) => axiosInstance.post(`/rooms/${id}/leave`);
export const getRoom = (id: string) => axiosInstance.get(`/rooms/${id}`);
