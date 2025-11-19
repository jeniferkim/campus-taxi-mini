// Mongo User 컬렉션 액세스용

import type { Db, ObjectId, Collection } from "mongodb";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
};

// 실제 MongoDB의 users 컬렉션 핸들
let users: Collection<UserDoc> | null = null;

// 서버 시작 시 한 번만 호출해서 컬렉션 초기화
export function initUserCollection(db: Db) {
  users = db.collection<UserDoc>("users");
}

// 라우터에서 가져다 쓰는 헬퍼
export function getUsersCollection(): Collection<UserDoc> {
  if (!users) {
    throw new Error(
      "[auth-service] users 컬렉션이 초기화되지 않았습니다. initUserCollection(db)를 먼저 호출하세요."
    );
  }
  return users;
}