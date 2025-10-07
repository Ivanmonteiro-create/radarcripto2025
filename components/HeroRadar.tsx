// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar" aria-hidden>
      <svg className="rc-radar__svg" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(33,243,141,0.25)" />
            <stop offset="70%" stopColor="rgba(33,243,141,0.10)" />
            <stop offset="100%" stopColor="rgba(33,243,141,0.00)" />
          </radialGradient>
          <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(60,255,160,0.35)" />
            <stop offset="70%" stopColor="rgba(60,255,160,0.10)" />
            <stop offset="100%" stopColor="rgba(60,255,160,0.00)" />
          </linearGradient>
          <mask id="arc">
            <rect width="200" height="200" fill="black" />
            <path d="M100,100 L190,100 A90,90 0 0,1 100,190 Z" fill="white" />
          </mask>
        </defs>

        {/* glow */}
        <circle cx="100" cy="100" r="95" fill="url(#rg)" />

        {/* círculos */}
        <g stroke="rgba(90,255,170,0.25)" strokeWidth="0.6" fill="none">
          <circle cx="100" cy="100" r="80" />
          <circle cx="100" cy="100" r="60" />
          <circle cx="100" cy="100" r="40" />
          <circle cx="100" cy="100" r="20" />
          <line x1="20" y1="100" x2="180" y2="100" />
          <line x1="100" y1="20" x2="100" y2="180" />
        </g>

        {/* feixe girando */}
        <g mask="url(#arc)">
          <rect className="rc-radar__sweep" x="100" y="100" width="100" height="100" fill="url(#sweep)" />
        </g>
      </svg>
    </div>
  );
}
