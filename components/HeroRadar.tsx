"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar rc-radar--alive" aria-hidden>
      <style>{`
        .rc-radar--alive {}
        .rc-radar__frame {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          z-index: 2;
        }
        .rc-radar__beam {
          width: var(--radar-size);
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          position: relative;
          background:
            conic-gradient(
              from 0turn,
              rgba(40,255,170,0.70) 0deg,
              rgba(40,255,170,0.30) 48deg,
              transparent 72deg 360deg
            );
          mix-blend-mode: screen;
          filter: blur(.3px);
          -webkit-mask:
            radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask:
            radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
          animation: rc-radar-spin 3.8s linear infinite; /* ← ajustado para mais lento */
        }
        .rc-radar__beam::after {
          content:"";
          position:absolute; inset:0;
          border-radius:50%;
          background:
            radial-gradient(closest-side, transparent 92%, rgba(40,255,170,.14) 96%, transparent 100%);
          -webkit-mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask: radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
        }
        .rc-radar__pulse {
          position:absolute; inset:0; display:grid; place-items:center;
          pointer-events:none;
        }
        .rc-radar__pulse::before {
          content:"";
          width: calc(var(--radar-size) * .26);
          height: calc(var(--radar-size) * .26);
          border-radius:50%;
          border: 2px solid rgba(40,255,170,.28);
          box-shadow: 0 0 24px rgba(40,255,170,.18);
          -webkit-mask: radial-gradient(circle at center, transparent 0 22%, #000 23% 100%);
                  mask: radial-gradient(circle at center, transparent 0 22%, #000 23% 100%);
          animation: rc-range-pulse 3.6s ease-out infinite;
        }
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
            radial-gradient(circle at 22% 36%, rgba(40,255,170,.0) 0 5px, rgba(40,255,170,.6) 5.5px, rgba(40,255,170,.0) 6px) no-repeat,
            radial-gradient(circle at 70% 26%, rgba(40,255,170,.0) 0 6px, rgba(40,255,170,.6) 6.5px, rgba(40,255,170,.0) 7px) no-repeat;
          animation: rc-blips-a 2.8s ease-in-out infinite;
          opacity:.85;
        }
        .rc-radar__blips::after {
          background:
            radial-gradient(circle at 66% 68%, rgba(40,255,170,.0) 0 4px, rgba(40,255,170,.55) 4.5px, rgba(40,255,170,.0) 5px) no-repeat,
            radial-gradient(circle at 32% 72%, rgba(40,255,170,.0) 0 4px, rgba(40,255,170,.55) 4.5px, rgba(40,255,170,.0) 5px) no-repeat;
          animation: rc-blips-b 3.4s ease-in-out infinite;
          opacity:.85;
        }

        @keyframes rc-radar-spin { to { transform: rotate(1turn); } }
        @keyframes rc-range-pulse {
          0%   { transform: scale(.6); opacity:.28; }
          70%  { transform: scale(1.15); opacity:.06; }
          100% { transform: scale(1.18); opacity:0; }
        }
        @keyframes rc-blips-a {
          0%,20%{ opacity:.9; }
          35%   { opacity:.2; }
          55%,75%{ opacity:.9; }
          100%  { opacity:.6; }
        }
        @keyframes rc-blips-b {
          0%,25%{ opacity:.9; }
          45%   { opacity:.2; }
          65%,85%{ opacity:.9; }
          100%  { opacity:.6; }
        }
      `}</style>

      <div className="rc-radar__frame">
        <div className="rc-radar__beam" />
        <div className="rc-radar__pulse" />
        <div className="rc-radar__blips" />
      </div>
    </div>
  );
}
