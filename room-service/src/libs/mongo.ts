import mongoose from "mongoose";

const MONGO_URL = process.env.MONGO_URL || "mongodb://mongo:27017/taxi";

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(MONGO_URL);
  console.log("[room-service] MongoDB connected");
}
