import { useEffect, useRef } from "react";

const COLORS = ["#f0be1a", "#ffffff", "#9aa4ad"];
const PIECE_COUNT = 140;
const DURATION_MS = 4000;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.6,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      vr: (Math.random() - 0.5) * 10,
    }));

    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.rotation += p.vr;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx!.restore();
      }
      if (now - start < DURATION_MS) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}
