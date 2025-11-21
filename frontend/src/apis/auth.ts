import { axiosInstance } from "./axios";
import type { User } from "../types/auth";

export const postSignup = (data: { 
  email: string; 
  password: string; 
  name: string 
}) =>
  axiosInstance.post<{ user: User }>("/auth/signup", data); // 응답 타입 지정

export const postLogin = (data: { email: string; password: string }) =>
  axiosInstance.post<{ user: User }>("/auth/login", data); // 응답 타입 지정

export const postLogout = () => axiosInstance.post("/auth/logout");

export const getMyInfo = () => 
  axiosInstance.get<{ user: User }>("/auth/me"); // 응답 타입 지정
