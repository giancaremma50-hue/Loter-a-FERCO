import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRoomRealtime } from "../hooks/useRoomRealtime";
import { supabase } from "../lib/supabase";
import { DECK_IMAGES } from "../lib/deck";
import { checkWin } from "../lib/checkWin";
import Tombola from "../components/Tombola";
import type { CardTemplate, Pattern } from "../types";

export default function AdminPanel() {
  const { code } = useParams<{ code: string }>();
  const { room, players, playersLoaded, notFound } = useRoomRealtime(code);
  const [templatesById, setTemplatesById] = useState<Record<number, CardTemplate>>({});

  useEffect(() => {
    supabase
      .from("loteria_card_templates")
      .select("*")
      .then(({ data }) => {
        const map: Record<number, CardTemplate> = {};
        for (const t of (data ?? []) as CardTemplate[]) map[t.id] = t;
        setTemplatesById(map);
      });
  }, []);

  if (notFound) return <main>Sala no encontrada.</main>;
  if (!room || !playersLoaded) return <main>Cargando sala...</main>;

  async function setPattern(pattern: Pattern) {
    await supabase.from("loteria_rooms").update({ pattern }).eq("id", room!.id);
  }

  async function startGame() {
    await supabase.from("loteria_rooms").update({ status: "playing" }).eq("id", room!.id);
  }

  async function drawPiece() {
    const remaining = DECK_IMAGES.map((_, i) => i).filter(
      (i) => !room!.drawn_pieces.includes(i)
    );
    if (remaining.length === 0) return;
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    await supabase
      .from("loteria_rooms")
      .update({ drawn_pieces: [...room!.drawn_pieces, next] })
      .eq("id", room!.id);
  }

  async function confirmWin(playerId: string, valid: boolean) {
    if (valid) {
      await supabase.from("loteria_rooms").update({ status: "finished" }).eq("id", room!.id);
    }
    await supabase.from("loteria_players").update({ shouted_at: null }).eq("id", playerId);
  }

  async function resetRoom() {
    await supabase
      .from("loteria_rooms")
      .update({ status: "waiting", drawn_pieces: [] })
      .eq("id", room!.id);
    await supabase
      .from("loteria_players")
      .update({ marks: Array(16).fill(false), shouted_at: null })
      .eq("room_id", room!.id);
  }

  const shouting = players.filter((p) => p.shouted_at);

  return (
    <main>
      <h1>Admin — sala {room.code}</h1>

      <section>
        <h2>Jugadores ({players.length})</h2>
        <ul>
          {players.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Patrón de la ronda</h2>
        {(["linea", "esquinas", "lleno"] as Pattern[]).map((p) => (
          <label key={p} style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="pattern"
              checked={room.pattern === p}
              onChange={() => setPattern(p)}
            />{" "}
            {p}
          </label>
        ))}
      </section>

      {room.status === "waiting" && (
        <p>
          <button onClick={startGame}>Iniciar partida</button>
        </p>
      )}

      {room.status === "playing" && (
        <Tombola
          drawnPieces={room.drawn_pieces}
          onDraw={drawPiece}
          disabled={room.drawn_pieces.length >= DECK_IMAGES.length}
        />
      )}

      {shouting.length > 0 && (
        <section>
          <h2>¡Gritaron lotería!</h2>
          {shouting.map((p) => {
            const template = p.template_id ? templatesById[p.template_id] : null;
            const valid = Boolean(
              template &&
                checkWin(template.grid, p.marks, room.drawn_pieces, room.pattern)
            );
            return (
              <div key={p.id}>
                <p>
                  {p.name}: {valid ? "GANÓ ✅" : "no válido ❌"}
                </p>
                <button onClick={() => confirmWin(p.id, true)}>Confirmar</button>{" "}
                <button onClick={() => confirmWin(p.id, false)}>Rechazar</button>
              </div>
            );
          })}
        </section>
      )}

      <p>
        <button onClick={resetRoom}>Reiniciar partida</button>
      </p>
    </main>
  );
}
