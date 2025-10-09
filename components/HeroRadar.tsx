// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar" aria-hidden>
      <svg
        className="rc-radar__svg"
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* brilho central */}
          <radialGradient id="rg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(40,255,170,0.25)" />
            <stop offset="70%" stopColor="rgba(40,255,170,0.10)" />
            <stop offset="100%" stopColor="rgba(40,255,170,0.00)" />
          </radialGradient>

          {/* rastro do feixe */}
          <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(40,255,170,0.65)" />
            <stop offset="70%" stopColor="rgba(40,255,170,0.28)" />
            <stop offset="100%" stopColor="rgba(40,255,170,0.00)" />
          </linearGradient>

          {/* máscara de arco para o feixe (quadrante) */}
          <mask id="arc">
            <rect width="200" height="200" fill="black" />
            {/* arco de 90° no canto inferior direito */}
            <path d="M100,100 L190,100 A90,90 0 0,1 100,190 Z" fill="white" />
          </mask>
        </defs>

        {/* glow central */}
        <circle cx="100" cy="100" r="95" fill="url(#rg)" />

        {/* anéis + eixos */}
        <g stroke="rgba(90,255,170,0.25)" strokeWidth="0.6" fill="none">
          <circle cx="100" cy="100" r="80" />
          <circle cx="100" cy="100" r="60" />
          <circle cx="100" cy="100" r="40" />
          <circle cx="100" cy="100" r="20" />
          <line x1="20" y1="100" x2="180" y2="100" />
          <line x1="100" y1="20" x2="100" y2="180" />
        </g>

        {/* estrelas/ruído leve */}
        <g fill="rgba(40,255,170,0.18)">
          <circle cx="62" cy="54" r="0.7" />
          <circle cx="138" cy="42" r="0.7" />
          <circle cx="156" cy="128" r="0.7" />
          <circle cx="52" cy="132" r="0.7" />
          <circle cx="88" cy="164" r="0.7" />
        </g>

        {/* FEIXE GIRANDO — grupo com animação nativa SVG */}
        <g mask="url(#arc)" transform-origin="100 100">
          {/* animação: rotação contínua do grupo inteiro */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="2.8s"
            repeatCount="indefinite"
          />
          {/* rastro/feixe */}
          <rect
            className="rc-radar__sweep"
            x="100"
            y="100"
            width="100"
            height="100"
            fill="url(#sweep)"
          />
        </g>
      </svg>
    </div>
  );
}
