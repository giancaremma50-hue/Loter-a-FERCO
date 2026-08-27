import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import TemplateCatalog from "../components/TemplateCatalog";
import type { CardTemplate, Room } from "../types";

export default function JoinRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: roomData } = await supabase
        .from("loteria_rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      if (!roomData) {
        setNotFound(true);
        return;
      }
      setRoom(roomData as Room);
      const { data: templateData } = await supabase
        .from("loteria_card_templates")
        .select("*");
      setTemplates((templateData ?? []) as CardTemplate[]);
    }
    load();
  }, [code]);

  async function handleJoin() {
    if (!room || !name.trim() || templates.length === 0) return;
    setJoining(true);
    const templateId =
      selectedId ?? templates[Math.floor(Math.random() * templates.length)].id;
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
      alert("No se pudo unir: " + error?.message);
      return;
    }
    localStorage.setItem(`loteria:${room.code}`, data.id);
    navigate(`/sala/${room.code}`);
  }

  if (notFound) return <main className="state-message">Sala no encontrada. Revisá el código.</main>;
  if (!room) return <main className="state-message">Cargando...</main>;

  return (
    <main>
      <h1>Sala {room.code}</h1>
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

        <h2>Elegí tu cartón</h2>
        <TemplateCatalog
          templates={templates}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <button className="block" onClick={handleJoin} disabled={joining || !name.trim()}>
          {selectedId ? "Confirmar cartón" : "Sorpréndeme (aleatorio)"}
        </button>
      </div>
    </main>
  );
}
