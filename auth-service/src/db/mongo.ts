// Mongo 연결

import { MongoClient, Db } from "mongodb";
import { initUserCollection } from "./users";

const MONGO_URL =
  process.env.MONGO_URL || "mongodb://taxi-mongo:27017/campus_taxi";

let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const client = await MongoClient.connect(MONGO_URL);
  // URL에 이미 /campus_taxi 가 붙어 있으니, 여기서는 db()만 호출
  db = client.db();

  // users 컬렉션 초기화
  initUserCollection(db);

  console.log("[auth-service] MongoDB connected:", MONGO_URL);
  return db;
}
