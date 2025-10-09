// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar rc-radar--kill-after" aria-hidden>
      {/* CSS local garante rotação viva e remove sobreposição do globals */}
      <style>{`
        .rc-radar__svg {
          width: var(--radar-size);
          height: var(--radar-size);
          display: block;
        }

        .rc-radar.rc-radar--kill-after::after { content: none !important; }

        @keyframes rc-sweep-spin { to { transform: rotate(360deg); } }
        .rc-sweep {
          transform-box: fill-box;
          transform-origin: 100px 100px;
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

          {/* máscara do arco (fatia de ~60°) */}
          <mask id="arc">
            <rect width="200" height="200" fill="black" />
            <path
              d="M100,100 L190,100 A90,90 0 0,1 154.5,154.5 Z"
              fill="white"
            />
          </mask>
        </defs>

        {/* glow central */}
        <circle cx="100" cy="100" r="95" fill="url(#rg)" />

        {/* grupo do feixe animado */}
        <g className="rc-sweep" mask="url(#arc)">
          <rect x="100" y="100" width="100" height="100" fill="url(#sweep)" />
        </g>
      </svg>
    </div>
  );
}
