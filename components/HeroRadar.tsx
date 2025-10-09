// components/HeroRadar.tsx
"use client";

import React from "react";

export default function HeroRadar() {
  return (
    <div className="rc-radar rc-radar--alive" aria-hidden>
      <style>{`
        /* Camada animada independente do layout global */
        .rc-radar__frame{
          position:absolute; inset:0;
          display:grid; place-items:center;
          pointer-events:none;
          z-index:2; /* acima da grade ::before, abaixo do hero */
        }

        /* Varredura CALMA + brilho celestial
           Observação: diminuímos o TAMANHO do RADAR (feixe) sem tocar no círculo,
           aplicando scale apenas nos elementos animados. */
        .rc-radar__beam{
          width:var(--radar-size); aspect-ratio:1/1; border-radius:50%;
          position:relative;
          transform:scale(.90);                /* ↓ feixe um pouco menor */
          transform-origin:center;
          background:
            conic-gradient(
              from 0turn,
              rgba(40,255,170,0.78) 0deg,      /* núcleo mais claro (brilho) */
              rgba(40,255,170,0.40) 78deg,     /* transição */
              rgba(40,255,170,0.18) 108deg,    /* cauda */
              transparent 118deg 360deg
            );
          mix-blend-mode:screen;
          filter:blur(.2px);
          -webkit-mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
          animation:rc-radar-spin 5.6s linear infinite; /* ← mais lento e calmo */
          /* Glow extra "celestial" suave */
          box-shadow:
            0 0 38px rgba(40,255,170,.22),
            0 0 160px rgba(40,255,170,.18);
        }
        /* Halo tangenciando a borda — suavizado */
        .rc-radar__beam::after{
          content:""; position:absolute; inset:0; border-radius:50%;
          background:radial-gradient(closest-side, transparent 92%, rgba(40,255,170,.12) 96%, transparent 100%);
          -webkit-mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
        }

        /* LISTRAS RETAS LUMINOSAS (scanlines futuristas) */
        .rc-radar__streaks{
          position:absolute; inset:0; display:grid; place-items:center; pointer-events:none;
          width:var(--radar-size); height:var(--radar-size); border-radius:50%;
          transform:scale(.90);                 /* acompanha o feixe menor */
          transform-origin:center;
          mix-blend-mode:screen; opacity:.42;   /* brilho controlado */
          -webkit-mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
        }
        /* duas camadas de listras, com rotações diferentes para dar efeito vivo */
        .rc-radar__streaks::before,
        .rc-radar__streaks::after{
          content:""; position:absolute; inset:0; border-radius:50%;
          background:
            /* linhas finas brilhantes repetidas */
            repeating-linear-gradient(
              0deg,
              rgba(40,255,170,.16) 0 1px,
              transparent 1px 9px
            );
        }
        .rc-radar__streaks::before{
          animation:rc-streaks-spin-a 18s linear infinite;
        }
        .rc-radar__streaks::after{
          transform:rotate(45deg);
          animation:rc-streaks-spin-b 26s linear infinite;
          opacity:.36; /* a segunda camada um pouco mais suave */
        }

        /* Pulso de alcance — leve e mais lento */
        .rc-radar__pulse{ position:absolute; inset:0; display:grid; place-items:center; pointer-events:none; }
        .rc-radar__pulse::before{
          content:"";
          width:calc(var(--radar-size)*.26); height:calc(var(--radar-size)*.26);
          border-radius:50%;
          border:2px solid rgba(40,255,170,.16);
          box-shadow:0 0 16px rgba(40,255,170,.10);
          -webkit-mask:radial-gradient(circle at center, transparent 0 22%, #000 23% 100%);
                  mask:radial-gradient(circle at center, transparent 0 22%, #000 23% 100%);
          animation:rc-range-pulse 6.2s ease-out infinite;
          transform:scale(.90);
        }

        /* Blips discretos — opacidade reduzida para não competir com o hero */
        .rc-radar__blips{
          position:absolute; inset:0; display:grid; place-items:center; pointer-events:none;
          width:var(--radar-size); height:var(--radar-size); border-radius:50%;
          transform:scale(.90);
          -webkit-mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
                  mask:radial-gradient(circle at center, transparent 0 24%, #000 25% 100%);
          mix-blend-mode:screen;
        }
        .rc-radar__blips::before,
        .rc-radar__blips::after{
          content:""; position:absolute; inset:0; border-radius:50%;
          background:
            radial-gradient(circle at 22% 36%, rgba(40,255,170,0) 0 5px, rgba(40,255,170,.42) 5.5px, rgba(40,255,170,0) 6px) no-repeat,
            radial-gradient(circle at 70% 26%, rgba(40,255,170,0) 0 6px, rgba(40,255,170,.42) 6.5px, rgba(40,255,170,0) 7px) no-repeat;
          animation:rc-blips-a 4.8s ease-in-out infinite; opacity:.65;
        }
        .rc-radar__blips::after{
          background:
            radial-gradient(circle at 66% 68%, rgba(40,255,170,0) 0 4px, rgba(40,255,170,.38) 4.5px, rgba(40,255,170,0) 5px) no-repeat,
            radial-gradient(circle at 32% 72%, rgba(40,255,170,0) 0 4px, rgba(40,255,170,.38) 4.5px, rgba(40,255,170,0) 5px) no-repeat;
          animation:rc-blips-b 5.4s ease-in-out infinite; opacity:.65;
        }

        /* Animações */
        @keyframes rc-radar-spin{ to{ transform:rotate(1turn); } }
        @keyframes rc-range-pulse{
          0%   { transform:scale(.80); opacity:.20; }
          80%  { transform:scale(1.15); opacity:.05; }
          100% { transform:scale(1.18); opacity:0; }
        }
        @keyframes rc-blips-a{
          0%,25%{ opacity:.65; }
          50%   { opacity:.18; }
          75%,100%{ opacity:.62; }
        }
        @keyframes rc-blips-b{
          0%,30%{ opacity:.65; }
          55%   { opacity:.18; }
          80%,100%{ opacity:.62; }
        }
        @keyframes rc-streaks-spin-a{ to{ transform:rotate(360deg); } }
        @keyframes rc-streaks-spin-b{ to{ transform:rotate(-360deg); } }
      `}</style>

      {/* Camadas do RADAR — círculo de trás continua igual (globals) */}
      <div className="rc-radar__frame">
        <div className="rc-radar__beam" />
        <div className="rc-radar__streaks" />
        <div className="rc-radar__pulse" />
        <div className="rc-radar__blips" />
      </div>
    </div>
  );
}
