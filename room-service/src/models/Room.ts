// src/models/Room.ts
import { Schema, model, type Document } from "mongoose";

export interface RoomDocument extends Document {
  title: string;
  departure: string;
  destination: string;
  departureTime: Date;
  maxPassenger: number;
  createdAt: Date;
  updatedAt: Date;
  hostId: string;
  hostName?: string; // 옵션으로 두고, 없으면 빈 문자열
  participants: string[];
}

const RoomSchema = new Schema<RoomDocument>(
  {
    title: { type: String, required: true },
    departure: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true },
    maxPassenger: { type: Number, required: true },
    hostId: { type: String, required: true },
    hostName: { type: String, required: true, default: "" },
    participants: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const RoomModel = model<RoomDocument>("Room", RoomSchema);
