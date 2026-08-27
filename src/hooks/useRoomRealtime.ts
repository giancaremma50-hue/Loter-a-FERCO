import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Player, Room } from "../types";

export function useRoomRealtime(roomCode: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!roomCode) return;
    let roomId: string | null = null;

    async function init() {
      const { data: roomData } = await supabase
        .from("loteria_rooms")
        .select("*")
        .eq("code", roomCode)
        .maybeSingle();
      if (!roomData) return;
      roomId = roomData.id;
      setRoom(roomData as Room);

      const { data: playerData } = await supabase
        .from("loteria_players")
        .select("*")
        .eq("room_id", roomId);
      setPlayers((playerData ?? []) as Player[]);
    }
    init();

    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loteria_rooms",
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.new) setRoom(payload.new as Room);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loteria_players" },
        (payload) => {
          const incoming = payload.new as Player | undefined;
          if (!incoming || incoming.room_id !== roomId) return;
          setPlayers((prev) => {
            const idx = prev.findIndex((p) => p.id === incoming.id);
            if (idx === -1) return [...prev, incoming];
            const next = [...prev];
            next[idx] = incoming;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  return { room, players };
}
