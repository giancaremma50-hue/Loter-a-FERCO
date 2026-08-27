const IMAGE_COUNT = 24;
const CARD_SLOTS = 16;
const TEMPLATE_COUNT = 100;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pool = Array.from({ length: IMAGE_COUNT }, (_, i) => i);
const seen = new Set();
const templates = [];
while (templates.length < TEMPLATE_COUNT) {
  const grid = shuffle(pool).slice(0, CARD_SLOTS);
  const key = grid.join(",");
  if (!seen.has(key)) {
    seen.add(key);
    templates.push(grid);
  }
}

const values = templates
  .map((grid) => `('{${grid.join(",")}}')`)
  .join(",\n  ");

console.log(`delete from public.loteria_card_templates;`);
console.log(`insert into public.loteria_card_templates (grid) values\n  ${values};`);
