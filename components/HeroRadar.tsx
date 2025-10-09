// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar rc-radar--alive" aria-hidden>
      {/* Estilos locais apenas do radar (não afetam o resto do site) */}
      <style>{`
        .rc-radar--alive {
          /* já herda posição/z-index do globals; não mudamos tamanho do círculo */
        }
        .rc-radar__frame {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          z-index: 2; /* acima do ::before do círculo, abaixo do hero */
        }
        .rc-radar__beam {
          width: var(--radar-size);
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          position: relative;
          /* feixe vivo e claro + cauda */
          background:
            conic-gradient(
              from 0turn,
              rgba(40,255,170,0.70) 0deg,
              rgba(40,255,170,0.30) 48deg,
              transparent 72deg 360deg
            );
          mix-blend-mode: screen;
          filter: blur(.3px);
          /* recorte: furo central (antena) e limite externo do círculo */
          -webkit-mask:
            radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask:
            radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
          animation: rc-radar-spin 2.6s linear infinite;
        }
        /* linha de varredura na borda para dar sensação de “scan” */
        .rc-radar__beam::after {
          content:"";
          position:absolute; inset:0;
          border-radius:50%;
          background:
            radial-gradient(closest-side, transparent 92%, rgba(40,255,170,.14) 96%, transparent 100%);
          -webkit-mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
        }
        /* fallback extra: se o conic estiver parado por qualquer motivo,
           forçamos repaint via steps para evitar throttling agressivo */
        @keyframes rc-radar-spin { to { transform: rotate(1turn); } }
      `}</style>

      {/* Camada animada do FEIXE (CSS puro) */}
      <div className="rc-radar__frame">
        <div className="rc-radar__beam" />
      </div>

      {/* Opcional: brilho central muito leve (não altera o círculo base) */}
      <svg
        className="rc-radar__svg"
        viewBox="0 0 200 200"
        width="0"
        height="0"
        aria-hidden="true"
        role="presentation"
      >
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(40,255,170,0.22)" />
            <stop offset="70%" stopColor="rgba(40,255,170,0.10)" />
            <stop offset="100%" stopColor="rgba(40,255,170,0.00)" />
          </radialGradient>
        </defs>
        {/* Mantemos o SVG vazio no DOM apenas se um dia quisermos overlay extra */}
      </svg>
    </div>
  );
}
