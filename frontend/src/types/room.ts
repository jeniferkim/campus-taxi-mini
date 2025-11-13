export type Room = {
  _id: string;
  title: string;
  departure: string;
  destination: string;
  departureTime: string;
  maxPassenger: number;
  participants?: Array<string | { _id: string }>;
  hostId?: string | { _id: string };
};