import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useRoomRealtime } from "../hooks/useRoomRealtime";
import TemplateCatalog from "../components/TemplateCatalog";
import type { CardTemplate } from "../types";

export default function JoinRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, players, notFound } = useRoomRealtime(code);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("loteria_card_templates")
      .select("*")
      .then(({ data }) => setTemplates((data ?? []) as CardTemplate[]));
  }, []);

  // Un cartón ya tomado por otro jugador de esta sala deja de ofrecerse —
  // así evitamos que dos personas elijan el mismo a simple vista.
  const takenIds = useMemo(
    () => new Set(players.map((p) => p.template_id).filter((id): id is number => id != null)),
    [players]
  );
  const available = useMemo(
    () => templates.filter((t) => !takenIds.has(t.id)),
    [templates, takenIds]
  );

  useEffect(() => {
    if (selectedId !== null && takenIds.has(selectedId)) {
      setSelectedId(null);
      setJoinError("Ese cartón ya lo tomaron, elegí otro.");
    }
  }, [selectedId, takenIds]);

  async function handleJoin() {
    if (!room || !name.trim() || available.length === 0) return;
    setJoining(true);
    setJoinError(null);
    const templateId =
      selectedId ?? available[Math.floor(Math.random() * available.length)].id;
    const { data, error } = await supabase
      .from("loteria_players")
      .insert({
        room_id: room.id,
        name: name.trim(),
        template_id: templateId,
        confirmed: true,
      })
      .select()
      .single();
    setJoining(false);
    if (error || !data) {
      // 23505 = violación de la restricción única (room_id, template_id):
      // alguien más agarró ese cartón un instante antes.
      if (error?.code === "23505") {
        setSelectedId(null);
        setJoinError("Justo lo tomó otra persona, elegí otro cartón.");
      } else {
        alert("No se pudo unir: " + error?.message);
      }
      return;
    }
    localStorage.setItem(`loteria:${room.code}`, data.id);
    navigate(`/sala/${room.code}`);
  }

  if (notFound) return <main className="state-message">Sala no encontrada. Revisá el código.</main>;
  if (!room) return <main className="state-message">Cargando...</main>;

  return (
    <main>
      <h1>{room.name}</h1>
      <p className="subtitle">Poné tu nombre y elegí tu cartón para jugar.</p>

      <div className="panel">
        <label className="field">
          <span className="field-label">Tu nombre</span>
          <input
            className="input"
            placeholder="Ej. Ana López"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <h2>Elegí tu cartón ({available.length} disponibles)</h2>
        {joinError && <p className="join-error">{joinError}</p>}
        {available.length === 0 ? (
          <p className="subtitle">No quedan cartones disponibles en esta sala.</p>
        ) : (
          <TemplateCatalog
            templates={available}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}

        <button
          className="block"
          onClick={handleJoin}
          disabled={joining || !name.trim() || available.length === 0}
        >
          {selectedId ? "Confirmar cartón" : "Sorpréndeme (aleatorio)"}
        </button>
      </div>
    </main>
  );
}
