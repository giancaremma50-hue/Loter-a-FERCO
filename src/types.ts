export type RoomStatus = "waiting" | "playing" | "verifying" | "finished";
export type Pattern = "linea" | "esquinas" | "lleno";

export interface Room {
  id: string;
  code: string;
  country: string | null;
  status: RoomStatus;
  pattern: Pattern;
  drawn_pieces: number[];
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  template_id: number | null;
  confirmed: boolean;
  marks: boolean[];
  shouted_at: string | null;
  joined_at: string;
}

export interface CardTemplate {
  id: number;
  grid: number[];
}
