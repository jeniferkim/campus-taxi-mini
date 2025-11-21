// 로그인 된 요청에 대한 타입
import type { Request } from "express";

export type AuthedRequest = Request & {
  user: {
    id: string;
    name: string;
  };
};