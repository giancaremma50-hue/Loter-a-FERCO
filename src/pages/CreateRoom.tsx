import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "../lib/supabase";
import { generateRoomCode } from "../lib/roomCode";

export default function CreateRoom() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [country, setCountry] = useState("GT");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    setCreating(true);
    const newCode = generateRoomCode();
    const { error } = await supabase
      .from("loteria_rooms")
      .insert({ code: newCode, country, status: "waiting", pattern: "lleno" });
    setCreating(false);
    if (error) {
      alert("No se pudo crear la sala: " + error.message);
      return;
    }
    const joinUrl = `${window.location.origin}/unirse/${newCode}`;
    setQrDataUrl(await QRCode.toDataURL(joinUrl));
    setCode(newCode);
  }

  return (
    <main>
      <h1>Lotería FERCO — Crear sala</h1>
      <label>
        País{" "}
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="GT">Guatemala</option>
          <option value="SV">El Salvador</option>
          <option value="HN">Honduras</option>
          <option value="MX">México</option>
        </select>
      </label>
      <p>
        <button onClick={handleCreate} disabled={creating}>
          {creating ? "Creando..." : "Crear sala"}
        </button>
      </p>
      {code && (
        <section>
          <p>
            Código: <strong>{code}</strong>
          </p>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR para unirse" width={220} height={220} />
          )}
          <p>
            Link: {window.location.origin}/unirse/{code}
          </p>
          <button onClick={() => navigate(`/sala/${code}/admin`)}>
            Ir al panel de admin
          </button>
        </section>
      )}
    </main>
  );
}
