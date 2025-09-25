'use client';

import { useEffect, useRef } from 'react';

type Props = { className?: string };

/**
 * Fundo “radar” animado com grid e feixe em canvas.
 * Seguro para Client Components e sem SSR.
 */
export default function RadarBackground({ className }: Props) {
  // ✅ IMPORTANTE: todos os useRef com valor inicial
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const angleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      // Ajusta transform para desenhar em “unidades CSS”
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const GRID = 60;

    function drawGrid() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (let x = 0; x <= w; x += GRID) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += GRID) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function animate() {
      if (!running) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);
      drawGrid();

      // Feixe “radar”
      const cx = w * 0.75;
      const cy = h * 0.35;
      const r = Math.min(w, h) * 0.6;

      angleRef.current += 0.01;
      const a = angleRef.current;

      const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      grad.addColorStop(0, 'rgba(33,243,141,0.18)');
      grad.addColorStop(1, 'rgba(33,243,141,0.0)');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a, a + Math.PI / 8);
      ctx.closePath();
      ctx.fill();

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
