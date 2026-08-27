import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useRoomRealtime } from "../hooks/useRoomRealtime";
import CardGrid from "../components/CardGrid";
import type { CardTemplate } from "../types";

export default function PlayerBoard() {
  const { code } = useParams<{ code: string }>();
  const { room, players, playersLoaded, notFound, updateLocalPlayer } =
    useRoomRealtime(code);
  const [template, setTemplate] = useState<CardTemplate | null>(null);

  const playerId = code ? localStorage.getItem(`loteria:${code}`) : null;
  const me = useMemo(
    () => players.find((p) => p.id === playerId) ?? null,
    [players, playerId]
  );

  useEffect(() => {
    if (!me?.template_id) return;
    supabase
      .from("loteria_card_templates")
      .select("*")
      .eq("id", me.template_id)
      .single()
      .then(({ data }) => setTemplate(data as CardTemplate));
  }, [me?.template_id]);

  async function toggleCell(i: number) {
    if (!me) return;
    const marks = [...me.marks];
    marks[i] = !marks[i];
    // Actualiza el estado local antes del round-trip: si no, dos clics
    // rápidos leen el mismo `me.marks` viejo y el segundo pisa al primero.
    updateLocalPlayer(me.id, { marks });
    await supabase.from("loteria_players").update({ marks }).eq("id", me.id);
  }

  async function shoutLoteria() {
    if (!me) return;
    await supabase
      .from("loteria_players")
      .update({ shouted_at: new Date().toISOString() })
      .eq("id", me.id);
  }

  if (notFound) return <main className="state-message">Sala no encontrada. Revisá el código.</main>;
  if (!code || !room || !playersLoaded)
    return <main className="state-message">Cargando sala...</main>;
  if (!me)
    return (
      <main className="state-message">No estás en esta sala. Unite desde el link del admin.</main>
    );
  if (!template) return <main className="state-message">Cargando tu cartón...</main>;

  return (
    <main>
      <div className="status-bar">
        <span className="room-tag">Sala {room.code}</span>
        <span className="count">Fichas llamadas: {room.drawn_pieces.length} / 16</span>
      </div>
      <CardGrid grid={template.grid} marks={me.marks} onToggle={toggleCell} />
      <button className="shout" onClick={shoutLoteria}>
        ¡Lotería!
      </button>
    </main>
  );
}
