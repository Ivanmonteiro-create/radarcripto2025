// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar rc-radar--kill-after" aria-hidden>
      {/* CSS local para garantir a animação em qualquer setup */}
      <style>{`
        /* Faz o SVG ocupar exatamente o mesmo tamanho do círculo definido no CSS global */
        .rc-radar__svg {
          width: var(--radar-size);
          height: var(--radar-size);
          display: block;
        }

        /* Se existir um ::after no .rc-radar (do globals.css), removemos para não cobrir o SVG */
        .rc-radar.rc-radar--kill-after::after { content: none !important; }

        /* Animação confiável (CSS) — rotação contínua */
        @keyframes rc-sweep-spin { to { transform: rotate(360deg); } }
        .rc-sweep {
          /* Necessário para transform funcionar direito em SVG */
          transform-box: fill-box;
          transform-origin: 100px 100px; /* centro do viewBox (200x200) */
          animation: rc-sweep-spin 2.8s linear infinite;
        }
      `}</style>

      <svg
        className="rc-radar__svg"
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          {/* brilho central suave */}
          <radialGradient id="rg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(40,255,170,0.22)" />
            <stop offset="70%" stopColor="rgba(40,255,170,0.10)" />
            <stop offset="100%" stopColor="rgba(40,255,170,0.00)" />
          </radialGradient>

          {/* gradiente do feixe com cauda */}
          <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(40,255,170,0.65)" />
            <stop offset="70%" stopColor="rgba(40,255,170,0.28)" />
            <stop offset="100%" stopColor="rgba(40,255,170,0.00)" />
          </linearGradient>

          {/* máscara em forma de "fatia" (wedge) para o feixe */}
          <mask id="arc">
            <rect width="200" height="200" fill="black" />
            <!-- Abertura ~60° (ajustável) no quadrante inferior direito -->
            <path d="M100,100 L190,100 A90,90 0 0,1 154.5,154.5 Z" fill="white" />
          </mask>
        </defs>

        {/* glow central (opcional, o círculo/grade vem do CSS ::before) */}
        <circle cx="100" cy="100" r="95" fill="url(#rg)" />

        {/* FEIXE GIRANDO (CSS animation) */}
        <g className="rc-sweep" mask="url(#arc)">
          {/* retângulo preenchido pelo gradiente; o grupo todo gira */}
          <rect x="100" y="100" width="100" height="100" fill="url(#sweep)" />
        </g>
      </svg>
    </div>
  );
}
