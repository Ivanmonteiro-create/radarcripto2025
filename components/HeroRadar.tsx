// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar rc-radar--alive" aria-hidden>
      <style>{`
        /* Camada animada independente do layout global */
        .rc-radar__frame {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          z-index: 2; /* acima da grade ::before, abaixo do hero */
          transform: scale(.88); /* ↓ ligeiramente menor, sem mexer no círculo base */
          transform-origin: center;
        }

        /* Varredura CALMA: mais lenta, feixe mais estreito e menos intenso */
        .rc-radar__beam {
          width: var(--radar-size);
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          position: relative;
          background:
            conic-gradient(
              from 0turn,
              rgba(40,255,170,0.50) 0deg,     /* núcleo mais suave */
              rgba(40,255,170,0.26) 70deg,    /* transição */
              rgba(40,255,170,0.12) 100deg,   /* cauda leve */
              transparent 110deg 360deg       /* resto transparente */
            );
          mix-blend-mode: screen;
          filter: blur(.25px);
          -webkit-mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
          animation: rc-radar-spin 5.2s linear infinite; /* ← bem mais lento */
        }

        /* Halo na borda também suavizado */
        .rc-radar__beam::after {
          content:"";
          position:absolute; inset:0;
          border-radius:50%;
          background:
            radial-gradient(closest-side, transparent 92%, rgba(40,255,170,.10) 96%, transparent 100%);
          -webkit-mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
        }

        /* Pulso de alcance: mais leve e mais lento */
        .rc-radar__pulse {
          position:absolute; inset:0; display:grid; place-items:center;
          pointer-events:none;
        }
        .rc-radar__pulse::before {
          content:"";
          width: calc(var(--radar-size) * .26);
          height: calc(var(--radar-size) * .26);
          border-radius:50%;
          border: 2px solid rgba(40,255,170,.18); /* menos luminoso */
          box-shadow: 0 0 18px rgba(40,255,170,.12);
          -webkit-mask: radial-gradient(circle at center, transparent 0 22%, #000 23% 100%);
                  mask: radial-gradient(circle at center, transparent 0 22%, #000 23% 100%);
          animation: rc-range-pulse 5.4s ease-out infinite; /* ciclo mais longo */
        }

        /* Blips discretos ainda presentes, porém com opacidade reduzida */
        .rc-radar__blips {
          position:absolute; inset:0; display:grid; place-items:center;
          pointer-events:none;
          width: var(--radar-size); height: var(--radar-size);
          border-radius:50%;
          -webkit-mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
          mix-blend-mode: screen;
        }
        .rc-radar__blips::before,
        .rc-radar__blips::after {
          content:"";
          position:absolute; inset:0; border-radius:50%;
          background:
            radial-gradient(circle at 22% 36%, rgba(40,255,170,.0) 0 5px, rgba(40,255,170,.45) 5.5px, rgba(40,255,170,.0) 6px) no-repeat,
            radial-gradient(circle at 70% 26%, rgba(40,255,170,.0) 0 6px, rgba(40,255,170,.45) 6.5px, rgba(40,255,170,.0) 7px) no-repeat;
          animation: rc-blips-a 4.2s ease-in-out infinite; /* mais lento */
          opacity:.7;
        }
        .rc-radar__blips::after {
          background:
            radial-gradient(circle at 66% 68%, rgba(40,255,170,.0) 0 4px, rgba(40,255,170,.40) 4.5px, rgba(40,255,170,.0) 5px) no-repeat,
            radial-gradient(circle at 32% 72%, rgba(40,255,170,.0) 0 4px, rgba(40,255,170,.40) 4.5px, rgba(40,255,170,.0) 5px) no-repeat;
          animation: rc-blips-b 4.8s ease-in-out infinite;
          opacity:.7;
        }

        @keyframes rc-radar-spin { to { transform: rotate(1turn); } }
        @keyframes rc-range-pulse {
          0%   { transform: scale(.6); opacity:.22; }
          75%  { transform: scale(1.12); opacity:.05; }
          100% { transform: scale(1.14); opacity:0; }
        }
        @keyframes rc-blips-a {
          0%,25%{ opacity:.7; }
          45%   { opacity:.15; }
          70%,90%{ opacity:.7; }
          100%  { opacity:.55; }
        }
        @keyframes rc-blips-b {
          0%,25%{ opacity:.7; }
          50%   { opacity:.15; }
          75%,95%{ opacity:.7; }
          100%  { opacity:.55; }
        }
      `}</style>

      {/* Feixe animado + pulse + blips (somente radar) */}
      <div className="rc-radar__frame">
        <div className="rc-radar__beam" />
        <div className="rc-radar__pulse" />
        <div className="rc-radar__blips" />
      </div>
    </div>
  );
}
