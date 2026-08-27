import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Player, Room } from "../types";

export function useRoomRealtime(roomCode: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!roomCode) return;
    let roomId: string | null = null;
    // Ficha temporal para eventos de loteria_players que llegan antes de
    // que roomId se conozca (entre el subscribe() y que resuelva el fetch
    // de la sala). Sin esto se pierden silenciosamente.
    const pendingPlayerEvents: Player[] = [];

    function upsertPlayer(incoming: Player) {
      setPlayers((prev) => {
        const idx = prev.findIndex((p) => p.id === incoming.id);
        if (idx === -1) return [...prev, incoming];
        const next = [...prev];
        next[idx] = incoming;
        return next;
      });
    }

    async function init() {
      const { data: roomData } = await supabase
        .from("loteria_rooms")
        .select("*")
        .eq("code", roomCode)
        .maybeSingle();
      if (!roomData) {
        setNotFound(true);
        return;
      }
      roomId = roomData.id;
      setRoom(roomData as Room);

      const { data: playerData } = await supabase
        .from("loteria_players")
        .select("*")
        .eq("room_id", roomId);
      setPlayers((playerData ?? []) as Player[]);
      setPlayersLoaded(true);

      for (const p of pendingPlayerEvents) {
        if (p.room_id === roomId) upsertPlayer(p);
      }
      pendingPlayerEvents.length = 0;
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
          if (!incoming) return;
          if (roomId === null) {
            pendingPlayerEvents.push(incoming);
            return;
          }
          if (incoming.room_id !== roomId) return;
          upsertPlayer(incoming);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  function updateLocalPlayer(id: string, patch: Partial<Player>) {
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  return { room, players, playersLoaded, notFound, updateLocalPlayer };
}
