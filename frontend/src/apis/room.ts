import { axiosInstance } from "./axios";

export const getRoomList = (departure?: string, destination?: string) =>
  axiosInstance.get("/rooms", { params: { departure, destination } });

export const createRoom = (data: {
  title: string;
  departure: string;
  destination: string;
  departureTime: string;  // ISO string
  maxPassenger: number;
}) => axiosInstance.post("/rooms", data);

export const joinRoom = (id: string) => axiosInstance.post(`/rooms/${id}/join`);
export const leaveRoom = (id: string) => axiosInstance.post(`/rooms/${id}/leave`);
export const getRoom = (id: string) => axiosInstance.get(`/rooms/${id}`);
