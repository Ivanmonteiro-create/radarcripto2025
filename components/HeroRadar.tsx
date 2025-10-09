// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar rc-radar--kill-after" aria-hidden>
      {/* CSS local: garante tamanho, animação e remove overlay global */}
      <style>{`
        .rc-radar__svg {
          width: var(--radar-size);
          height: var(--radar-size);
          display: block;
        }
        .rc-radar.rc-radar--kill-after::after { content: none !important; }

        /* Fallback CSS se animação SVG for ignorada */
        @keyframes rc-sweep-spin { to { transform: rotate(360deg); } }
        .rc-sweep--fallback {
          transform-box: fill-box;
          transform-origin: 100px 100px;
          animation: rc-sweep-spin 2.6s linear infinite;
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

          {/* gradientes do feixe (principal + rastro) */}
          <linearGradient id="beamMain" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(40,255,170,0.70)" />
            <stop offset="70%"  stopColor="rgba(40,255,170,0.32)" />
            <stop offset="100%" stopColor="rgba(40,255,170,0.00)" />
          </linearGradient>
          <linearGradient id="beamTrail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(40,255,170,0.20)" />
            <stop offset="90%"  stopColor="rgba(40,255,170,0.05)" />
            <stop offset="100%" stopColor="rgba(40,255,170,0.00)" />
          </linearGradient>

          {/* Máscaras de fatia (90° e ~130°) */}
          <mask id="arc90">
            <rect width="200" height="200" fill="black" />
            {/* wedge 90° no quadrante inferior direito */}
            <path d="M100,100 L190,100 A90,90 0 0,1 100,190 Z" fill="white" />
          </mask>
          <mask id="arc90WideTrail">
            <rect width="200" height="200" fill="black" />
            {/* wedge ~130° para o rastro suave */}
            <path d="M100,100 L190,100 A90,90 0 0,1 128,186 Z" fill="white" />
          </mask>
        </defs>

        {/* Glow central */}
        <circle cx="100" cy="100" r="95" fill="url(#rg)" />

        {/* GRUPO ANIMADO (usa SMIL e fallback CSS) */}
        <g className="rc-sweep--fallback" transform-origin="100 100">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="2.6s"
            repeatCount="indefinite"
          />
          {/* feixe principal */}
          <g mask="url(#arc90)">
            <rect x="100" y="100" width="100" height="100" fill="url(#beamMain)" />
          </g>
          {/* rastro suave */}
          <g mask="url(#arc90WideTrail)">
            <rect x="100" y="100" width="100" height="100" fill="url(#beamTrail)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
