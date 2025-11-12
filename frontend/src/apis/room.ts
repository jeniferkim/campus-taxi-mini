import { axiosInstance } from "./axios";

export const getRoomList = (departure?: string, destination?: string) =>
  axiosInstance.get("/rooms", { params: { departure, destination } });
