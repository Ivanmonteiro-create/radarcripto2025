'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** 0 a 1 – controla a “força” do efeito (opacidade geral) */
  intensity?: number;
  /** velocidade da varredura (segundos por rotação) */
  rotationSeconds?: number;
  /** deixa o canvas estático para quem prefere reduzir movimento */
  respectReducedMotion?: boolean;
  /** diminui partículas/efeito em mobile low-end */
  lowPowerMode?: boolean;
  /** cor principal do radar (neon) */
  color?: string; // default '#1cff80'
};

/**
 * RadarBackground
 * Canvas de fundo com círculos concêntricos + varredura (sweep) + pontos sutis.
 * Absolutamente não interfere no conteúdo (fica em z-index: 0).
 */
export default function RadarBackground({
  intensity = 0.12,
  rotationSeconds = 14,
  respectReducedMotion = true,
  lowPowerMode = false,
  color = '#1cff80',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>();
  const lastTsRef = useRef<number>(0);
  const angleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const w = Math.floor((rect?.width || window.innerWidth) * dpr);
      const h = Math.floor((rect?.height || window.innerHeight) * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const prefersReduced =
      respectReducedMotion &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // partículas: quantidade ajustada
    const DOTS = lowPowerMode ? 20 : 40;

    // desenha uma cena do radar
    const draw = (ts: number) => {
      const { width: W, height: H } = canvas;
      const cx = W / 2;
      const cy = H / 2;
      // fundo transparente
      ctx.clearRect(0, 0, W, H);

      // glow muito leve no centro
      const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
      radial.addColorStop(0, hexWithAlpha(color, 0.05 * intensity));
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);

      // círculos concêntricos
      const ringCount = 6;
      ctx.lineWidth = 1 * dpr;
      for (let i = 1; i <= ringCount; i++) {
        const r = (Math.min(W, H) / 2) * (i / ringCount);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = hexWithAlpha(color, 0.22 * intensity * (1 - i / (ringCount + 1)));
        ctx.stroke();
      }

      // “cruz” muito sutil (eixo X/Y)
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(W, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, H);
      ctx.strokeStyle = hexWithAlpha('#ffffff', 0.04 * intensity);
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();

      // partículas (pings) discretas
      for (let i = 0; i < DOTS; i++) {
        const a = (i / DOTS) * Math.PI * 2;
        const r = (Math.min(W, H) / 2) * (0.25 + (i % 10) / 12);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        const size = 1 * dpr;
        ctx.fillStyle = hexWithAlpha('#ffffff', 0.03 * intensity);
        ctx.fillRect(x, y, size, size);
      }

      // varredura (sweep)
      if (!prefersReduced) {
        const delta = (ts - lastTsRef.current) || 16;
        lastTsRef.current = ts;
        const perMs = (Math.PI * 2) / (rotationSeconds * 1000);
        angleRef.current = (angleRef.current + perMs * delta) % (Math.PI * 2);

        // desenha um setor com gradiente angular (mais forte na frente, some atrás)
        const sweepWidth = Math.PI / 10; // ~18°
        const start = angleRef.current - sweepWidth;
        const end = angleRef.current + sweepWidth;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H));
        grad.addColorStop(0.0, hexWithAlpha(color, 0.30 * intensity));
        grad.addColorStop(0.2, hexWithAlpha(color, 0.18 * intensity));
        grad.addColorStop(1.0, 'rgba(0,0,0,0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, Math.max(W, H), start, end, false);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // “linha” de varredura
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, Math.max(W, H), end - 0.002, end + 0.002, false);
        ctx.closePath();
        ctx.fillStyle = hexWithAlpha(color, 0.5 * intensity);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    // controla pausa quando aba não estiver ativa
    const onVis = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } else {
        lastTsRef.current = performance.now();
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    // start
    lastTsRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [color, intensity, lowPowerMode, respectReducedMotion, rotationSeconds]);

  return (
    <canvas
      ref={canvasRef}
      className="bgCanvas"
      aria-hidden="true"
      style={{ opacity: clamp(intensity, 0, 1) }}
    />
  );
}

function hexWithAlpha(hex: string, alpha: number) {
  // aceita #rgb, #rrggbb
  const c = hex.replace('#', '');
  const bigint =
    c.length === 3
      ? parseInt(c.split('').map((x) => x + x).join(''), 16)
      : parseInt(c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
