'use client';

import { useEffect, useRef } from 'react';

export default function RadarBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;

    const css = getComputedStyle(document.documentElement);
    const ACCENT = (css.getPropertyValue('--accent') || '#21f38d').trim();
    const ACCENT_STRONG = (css.getPropertyValue('--accent-strong') || '#1cff80').trim();

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const { clientWidth: w, clientHeight: h } = canvas.parentElement || canvas;
      canvas.width = Math.max(1, w) * dpr;
      canvas.height = Math.max(1, h) * dpr;
      canvas.style.width = `${Math.max(1, w)}px`;
      canvas.style.height = `${Math.max(1, h)}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    let angle = 0;
    const speed = 1.05; // um pouco mais rápido

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.46;

      ctx.clearRect(0, 0, w, h);

      // vinheta
      const vignette = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.2);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      // anéis + cruz
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      const rings = 5;
      for (let i = 1; i <= rings; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, (r / rings) * i, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
      ctx.moveTo(0, -r); ctx.lineTo(0, r);
      ctx.stroke();

      // ponto central
      ctx.fillStyle = ACCENT_STRONG;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // feixe varrendo (mais forte e com "afterglow")
      angle = (angle + speed * (1 / 60)) % (Math.PI * 2);
      const sweepWidth = Math.PI / 9;

      // halo do feixe
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      // opacidades maiores (44/33 ~ 27%/20%)
      grad.addColorStop(0.0, `${ACCENT}44`);
      grad.addColorStop(0.45, `${ACCENT}33`);
      grad.addColorStop(1.0, 'rgba(0,0,0,0)');

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle - sweepWidth, angle + sweepWidth, false);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // linha do feixe (brilho central)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.strokeStyle = ACCENT_STRONG;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = ACCENT_STRONG;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      ctx.restore();

      // borda do radar com leve brilho
      ctx.save();
      ctx.strokeStyle = ACCENT;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%' }} aria-hidden="true" />;
}
