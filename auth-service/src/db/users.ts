// Mongo User 컬렉션 액세스용

import { Db, ObjectId } from "mongodb";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
};

let users: any;

export function initUserCollection(db: Db) {
  users = db.collection<UserDoc>("users");
}

export function getUsersCollection() {
  return users;
}
