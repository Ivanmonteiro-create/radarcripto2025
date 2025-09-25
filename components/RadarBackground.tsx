// components/RadarBackground.tsx
'use client';

import { useEffect, useRef } from 'react';

type Props = {
  sectors?: number;
  rings?: number;
  sweepSpeed?: number;   // rad/s
  beamWidthDeg?: number; // largura do feixe em graus
  accent?: string;
  opacity?: number;
  className?: string;
};

export default function RadarBackground({
  sectors = 8,
  rings = 5,
  sweepSpeed = 0.9,
  beamWidthDeg = 55,
  accent = '#21f38d',
  opacity = 1,
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const DPR = Math.max(1, window.devicePixelRatio || 1);

    // Lê tamanho de forma segura (prefere o pai; cai para o próprio canvas)
    const readSize = () => {
      const parent = canvas.parentElement as HTMLElement | null;
      const w = (parent?.clientWidth ?? canvas.clientWidth ?? 0);
      const h = (parent?.clientHeight ?? canvas.clientHeight ?? 0);
      return { width: Math.max(1, w), height: Math.max(1, h) };
    };

    const resize = () => {
      const { width, height } = readSize();
      // aplica DPI
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const drawGrid = (cx: number, cy: number, r: number) => {
      ctx.save();
      ctx.translate(cx, cy);

      // círculos concêntricos
      for (let i = 1; i <= rings; i++) {
        const rr = (i / rings) * r;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(33,243,141,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // setores radiais
      for (let i = 0; i < sectors; i++) {
        const ang = (i / sectors) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        ctx.strokeStyle = 'rgba(33,243,141,0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // aro externo com glow
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r);
      grd.addColorStop(0, 'rgba(33,243,141,0.0)');
      grd.addColorStop(1, 'rgba(33,243,141,0.35)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    };

    let t0 = performance.now();

    const loop = (t: number) => {
      if (!running) return;

      // garante que ainda existe
      if (!ref.current) return;

      const { width, height } = readSize();
      // limpa área “CSS pixels” (ctx já está com transform de DPR)
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;

      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.42;

      // grade
      drawGrid(cx, cy, r);

      // feixe
      const dt = (t - t0) / 1000;
      t0 = t;

      const beamWidthRad = (beamWidthDeg * Math.PI) / 180;
      const angle = ((t / 1000) * sweepSpeed) % (Math.PI * 2);

      ctx.save();
      ctx.translate(cx, cy);

      // cone com gradiente
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, `${accent}CC`);
      grad.addColorStop(1, `${accent}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, angle - beamWidthRad / 2, angle + beamWidthRad / 2);
      ctx.closePath();
      ctx.fill();

      // raio “aceso”
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.stroke();

      ctx.restore();

      raf = requestAnimationFrame(loop);
    };

    // Observa tamanho do container para redimensionar com segurança
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement ?? canvas);

    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [sectors, rings, sweepSpeed, beamWidthDeg, accent, opacity]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  );
}
