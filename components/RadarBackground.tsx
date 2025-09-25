'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** diâmetro do radar em px (em desktop) */
  size?: number;
  /** opacidade do feixe (0–1) */
  beamAlpha?: number;
  /** velocidade do sweep (maior = mais rápido) */
  speed?: number;
};

export default function RadarBackground({
  size = 760,
  beamAlpha = 0.35,   // ✅ mais sutil
  speed = 0.015,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // resize helper
    const resize = () => {
      // ocupa toda a seção e mantém definição alta
      const rect = canvas.parentElement?.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor((rect?.width || size) * dpr);
      const h = Math.floor((rect?.height || size) * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };
    resize();
    window.addEventListener('resize', resize);

    // paleta
    const green = '#21f38d';
    const grid = 'rgba(255,255,255,0.08)';

    let angle = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.44;

      ctx.clearRect(0, 0, w, h);

      // leve vinheta
      const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.2);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // círculos do radar
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, (r * i) / 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      // cruz central
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();

      // círculo externo com brilho
      ctx.shadowColor = green;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // feixe (sweep)
      ctx.save();
      ctx.translate(cx, cy);
      const sweep = Math.PI / 12; // ~15°
      const from = angle;
      const to = angle + sweep;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, `rgba(33,243,141,${beamAlpha})`);
      grad.addColorStop(1, 'rgba(33,243,141,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, from, to, false);
      ctx.closePath();
      ctx.fill();

      // linha central do feixe – mais visível
      ctx.strokeStyle = `rgba(33,243,141,0.9)`;
      ctx.shadowColor = green;
      ctx.shadowBlur = 9;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * Math.cos(angle + sweep / 2), r * Math.sin(angle + sweep / 2));
      ctx.stroke();
      ctx.restore();

      // anima
      angle = (angle + speed) % (Math.PI * 2);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, beamAlpha, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // atrás do conteúdo
        pointerEvents: 'none',
      }}
    />
  );
}
