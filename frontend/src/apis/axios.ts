import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // 쿠키 기반 세션 인증을 위해 필요
});