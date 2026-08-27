import { DECK_IMAGES } from "../lib/deck";

const FICHA_SRC = "/images/ficha-frijol.png";

interface Props {
  grid: number[];
  marks: boolean[];
  onToggle: (index: number) => void;
}

export default function CardGrid({ grid, marks, onToggle }: Props) {
  return (
    <div className="card-grid">
      {grid.map((imgIndex, i) => (
        <button
          key={i}
          type="button"
          className="card-cell"
          onClick={() => onToggle(i)}
        >
          <img src={DECK_IMAGES[imgIndex].src} alt={DECK_IMAGES[imgIndex].label} />
          {marks[i] && <img className="ficha" src={FICHA_SRC} alt="marcado" />}
        </button>
      ))}
    </div>
  );
}
