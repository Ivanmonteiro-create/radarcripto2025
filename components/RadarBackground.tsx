'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** linhas radiais do grid */
  sectors?: number;
  /** círculos concêntricos */
  rings?: number;
  /** velocidade do feixe (radianos por segundo) */
  sweepSpeed?: number;
  /** largura do feixe em graus */
  beamWidthDeg?: number;
  /** cor principal */
  accent?: string;
  /** opacidade global do canvas */
  opacity?: number;
  /** classe extra opcional */
  className?: string;
};

export default function RadarBackground({
  sectors = 8,
  rings = 5,
  sweepSpeed = 0.9,     // mais rápido que antes
  beamWidthDeg = 55,     // feixe um pouco mais largo
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

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;

      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function drawGrid(cx: number, cy: number, r: number) {
      ctx.save();
      ctx.translate(cx, cy);

      // círculos
      for (let i = 1; i <= rings; i++) {
        const rr = (i / rings) * r;
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(33,243,141,0.25)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // linhas radiais
      for (let i = 0; i < sectors; i++) {
        const ang = (i / sectors) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        ctx.strokeStyle = `rgba(33,243,141,0.18)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // círculo externo “glow”
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r);
      grd.addColorStop(0, 'rgba(33,243,141,0.0)');
      grd.addColorStop(1, 'rgba(33,243,141,0.35)');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    let t0 = performance.now();

    function loop(t: number) {
      if (!running) return;

      const dt = (t - t0) / 1000;
      t0 = t;

      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;

      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.42;

      // GRID
      drawGrid(cx, cy, r);

      // FEIXE
      const beamWidthRad = (beamWidthDeg * Math.PI) / 180;
      // ângulo atual (cresce com o tempo)
      const angle = ((t / 1000) * sweepSpeed) % (Math.PI * 2);

      ctx.save();
      ctx.translate(cx, cy);

      // cone do feixe com gradiente — bem brilhante
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, `${accent}CC`);  // mais forte no centro
      grad.addColorStop(1, `${accent}00`);  // some no limite

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, angle - beamWidthRad / 2, angle + beamWidthRad / 2);
      ctx.closePath();
      ctx.fill();

      // linha do feixe (raio) – mais “acesa”
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      ctx.strokeStyle = `${accent}`;
      ctx.lineWidth = 2;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18; // brilho
      ctx.stroke();

      ctx.restore();

      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      resize();
    };

    resize();
    raf = requestAnimationFrame(loop);
    window.addEventListener('resize', onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [sectors, rings, sweepSpeed, beamWidthDeg, accent, opacity]);

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden
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
