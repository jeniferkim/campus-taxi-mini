// src/models/Room.ts
import { Schema, model, type Document } from "mongoose";

export interface RoomDocument extends Document {
  title: string;
  departure: string;
  destination: string;
  departureTime: Date;
  maxPassenger: number;
  hostId: string;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<RoomDocument>(
  {
    title: { type: String, required: true },
    departure: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: Date, required: true },
    maxPassenger: { type: Number, required: true },
    hostId: { type: String, required: true },
    participants: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const RoomModel = model<RoomDocument>("Room", RoomSchema);
