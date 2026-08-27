import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { generateRoomCode } from "../lib/roomCode";

export default function CreateRoom() {
  const [country, setCountry] = useState("GT");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    setCreating(true);
    const newCode = generateRoomCode();
    const { error } = await supabase
      .from("loteria_rooms")
      .insert({ code: newCode, country, status: "waiting", pattern: "lleno" });
    if (error) {
      setCreating(false);
      alert("No se pudo crear la sala: " + error.message);
      return;
    }
    navigate(`/sala/${newCode}/admin`);
  }

  return (
    <main>
      <h1>Lotería FERCO</h1>
      <p className="subtitle">Creá una sala para tu equipo y compartí el código.</p>

      <div className="panel">
        <label className="field">
          <span className="field-label">País</span>
          <select
            className="select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="GT">Guatemala</option>
            <option value="SV">El Salvador</option>
            <option value="HN">Honduras</option>
            <option value="MX">México</option>
          </select>
        </label>
        <button className="block" onClick={handleCreate} disabled={creating}>
          {creating ? "Creando..." : "Crear sala"}
        </button>
      </div>
    </main>
  );
}
