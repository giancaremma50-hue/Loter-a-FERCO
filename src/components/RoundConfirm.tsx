import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import TemplateCatalog from "./TemplateCatalog";
import type { CardTemplate, Player, Room } from "../types";

interface Props {
  room: Room;
  me: Player;
  players: Player[];
}

export default function RoundConfirm({ room, me, players }: Props) {
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("loteria_card_templates")
      .select("*")
      .then(({ data }) => setTemplates((data ?? []) as CardTemplate[]));
  }, []);

  const takenIds = useMemo(
    () =>
      new Set(
        players
          .filter((p) => p.id !== me.id)
          .map((p) => p.template_id)
          .filter((id): id is number => id != null)
      ),
    [players, me.id]
  );
  const available = useMemo(
    () => templates.filter((t) => !takenIds.has(t.id)),
    [templates, takenIds]
  );

  async function keepCard() {
    setBusy(true);
    await supabase.from("loteria_players").update({ confirmed: true }).eq("id", me.id);
    setBusy(false);
  }

  async function confirmNewCard() {
    if (selectedId === null) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from("loteria_players")
      .update({ template_id: selectedId, confirmed: true })
      .eq("id", me.id);
    setBusy(false);
    if (err) {
      setSelectedId(null);
      if (err.code === "23505") {
        setError("Justo lo tomó otra persona, elegí otro cartón.");
      } else {
        setError("No se pudo cambiar de cartón: " + err.message);
      }
    }
  }

  return (
    <main>
      <h1>{room.name}</h1>
      <p className="subtitle">Nueva ronda — ¿seguís con tu cartón o elegís otro?</p>

      <div className="panel">
        {!showCatalog ? (
          <>
            <button className="block" onClick={keepCard} disabled={busy}>
              Seguir con este cartón
            </button>
            <button
              className="secondary block"
              onClick={() => setShowCatalog(true)}
              disabled={busy}
            >
              Elegir otro cartón
            </button>
          </>
        ) : (
          <>
            <h2>Elegí tu cartón ({available.length} disponibles)</h2>
            {error && <p className="join-error">{error}</p>}
            <TemplateCatalog
              templates={available}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <button
              className="block"
              onClick={confirmNewCard}
              disabled={busy || selectedId === null}
            >
              Confirmar nuevo cartón
            </button>
          </>
        )}
      </div>
    </main>
  );
}
