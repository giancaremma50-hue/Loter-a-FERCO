import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { useRoomRealtime } from "../hooks/useRoomRealtime";
import { supabase } from "../lib/supabase";
import { DECK_IMAGES } from "../lib/deck";
import { checkWin } from "../lib/checkWin";
import Tombola from "../components/Tombola";
import type { CardTemplate, Pattern } from "../types";

export default function AdminPanel() {
  const { code } = useParams<{ code: string }>();
  const { room, players, playersLoaded, notFound, updateLocalRoom } =
    useRoomRealtime(code);
  const [templatesById, setTemplatesById] = useState<Record<number, CardTemplate>>({});
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("loteria_card_templates")
      .select("*")
      .then(({ data }) => {
        const map: Record<number, CardTemplate> = {};
        for (const t of (data ?? []) as CardTemplate[]) map[t.id] = t;
        setTemplatesById(map);
        setTemplatesLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!code) return;
    QRCode.toDataURL(`${window.location.origin}/unirse/${code}`).then(setQrDataUrl);
  }, [code]);

  if (notFound) return <main className="state-message">Sala no encontrada.</main>;
  if (!room || !playersLoaded) return <main className="state-message">Cargando sala...</main>;

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
    const drawn_pieces = [...room!.drawn_pieces, next];
    updateLocalRoom({ drawn_pieces });
    await supabase.from("loteria_rooms").update({ drawn_pieces }).eq("id", room!.id);
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
      <h1>Sala {room.code}</h1>
      <p className="subtitle">Panel de administración</p>

      <div className="panel room-code room-code--compact">
        {qrDataUrl && <img src={qrDataUrl} alt="QR para unirse" width={140} height={140} />}
        <p className="join-link">
          Compartí: {window.location.origin}/unirse/{room.code}
        </p>
      </div>

      <div className="panel">
        <h2>Paso 1 · Jugadores ({players.length})</h2>
        {players.length === 0 ? (
          <p className="subtitle">Todavía no se unió nadie.</p>
        ) : (
          <ul className="roster">
            {players.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h2>Paso 2 · Patrón y arranque</h2>
        <div className="pattern-picker">
          {(["linea", "esquinas", "lleno"] as Pattern[]).map((p) => (
            <label key={p}>
              <input
                type="radio"
                name="pattern"
                checked={room.pattern === p}
                onChange={() => setPattern(p)}
              />
              {p}
            </label>
          ))}
        </div>

        {room.status === "waiting" && (
          <button className="block" onClick={startGame}>
            Iniciar partida
          </button>
        )}
        {room.status !== "waiting" && (
          <p className="subtitle">Patrón activo: {room.pattern}</p>
        )}
      </div>

      {room.status === "playing" && (
        <div className="panel">
          <h2>Paso 3 · Tómbola</h2>
          <Tombola
            drawnPieces={room.drawn_pieces}
            onDraw={drawPiece}
            disabled={room.drawn_pieces.length >= DECK_IMAGES.length}
          />
        </div>
      )}

      {shouting.length > 0 && (
        <div className="panel">
          <h2>¡Gritaron lotería!</h2>
          {!templatesLoaded ? (
            <p className="subtitle">Cargando cartones para verificar...</p>
          ) : (
            shouting.map((p) => {
              const template = p.template_id ? templatesById[p.template_id] : null;
              const valid = Boolean(
                template &&
                  checkWin(template.grid, p.marks, room.drawn_pieces, room.pattern)
              );
              return (
                <div key={p.id} className="winner-check">
                  <p className={valid ? "verdict win" : "verdict lose"}>
                    {p.name}: {valid ? "GANÓ ✅" : "no válido ❌"}
                  </p>
                  <div className="actions">
                    <button onClick={() => confirmWin(p.id, true)}>Confirmar</button>
                    <button className="secondary" onClick={() => confirmWin(p.id, false)}>
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <button className="secondary block" onClick={resetRoom}>
        Reiniciar partida
      </button>
    </main>
  );
}
