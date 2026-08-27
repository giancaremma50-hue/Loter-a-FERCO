import { DECK_IMAGES } from "../lib/deck";
import type { CardTemplate } from "../types";

interface Props {
  templates: CardTemplate[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function TemplateCatalog({ templates, selectedId, onSelect }: Props) {
  return (
    <div className="template-catalog">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === selectedId ? "template-card selected" : "template-card"}
          onClick={() => onSelect(t.id)}
        >
          <div className="mini-grid">
            {t.grid.map((imgIndex, i) => (
              <img key={i} src={DECK_IMAGES[imgIndex].src} alt="" />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
