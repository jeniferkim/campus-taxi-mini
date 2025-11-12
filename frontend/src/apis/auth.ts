import { axiosInstance } from "./axios";

export const postSignup = (data: { email: string; password: string; name: string }) =>
  axiosInstance.post("/auth/signup", data);

export const postLogin = (data: { email: string; password: string }) =>
  axiosInstance.post("/auth/login", data);

export const getMyInfo = () => axiosInstance.get("/auth/me");
