import { DECK_IMAGES } from "../lib/deck";

interface Props {
  drawnPieces: number[];
  onDraw: () => void;
  disabled: boolean;
}

export default function Tombola({ drawnPieces, onDraw, disabled }: Props) {
  const last = drawnPieces[drawnPieces.length - 1];
  return (
    <div className="tombola">
      <button onClick={onDraw} disabled={disabled}>
        Sacar ficha ({drawnPieces.length}/{DECK_IMAGES.length})
      </button>
      {last !== undefined && (
        <div className="last-drawn">
          <img src={DECK_IMAGES[last].src} alt={DECK_IMAGES[last].label} />
          <p>{DECK_IMAGES[last].label}</p>
        </div>
      )}
    </div>
  );
}
