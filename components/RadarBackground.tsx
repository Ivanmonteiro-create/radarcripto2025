'use client';

import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
  style?: React.CSSProperties;
  /** velocidade do feixe (0.3~1.2 fica legal) */
  speed?: number;
};

export default function RadarBackground({ className, style, speed = 0.6 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const fit = () => {
      const parent = canvas.parentElement;
      const w = (parent?.clientWidth || window.innerWidth);
      const h = (parent?.clientHeight || window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fit();
    let angle = 0;

    const draw = () => {
      // largura/altura em CSS pixels
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      // fundo sutil
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, 'rgba(33,243,141,0.05)');
      bg.addColorStop(1, 'rgba(33,243,141,0.02)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // grade
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const step = 60;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // radar
      const cx = w * 0.75;
      const cy = h * 0.5;
      const r = Math.min(w, h) * 0.45;

      ctx.save();
      ctx.translate(cx, cy);

      // anéis
      ctx.strokeStyle = 'rgba(33,243,141,0.18)';
      for (let rr = r; rr > 0; rr -= r / 4) {
        ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
      }

      // feixe
      const sweep = Math.PI / 8;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, 'rgba(33,243,141,0.35)');
      grad.addColorStop(1, 'rgba(33,243,141,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, angle, angle + sweep, false);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      angle += (speed / 180) * Math.PI; // ~deg/frame
      rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => fit();

    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, ...style }}
      aria-hidden="true"
    />
  );
}
