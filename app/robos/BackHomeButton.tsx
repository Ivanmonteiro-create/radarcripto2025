"use client";

import React from "react";

export default function BackHomeButton() {
  return (
    <>
      <a href="/" className="robos-back-home" aria-label="Voltar ao início">
        Voltar ao início
      </a>

      {/* Estilos só do botão (ok em Client Component) */}
      <style jsx>{`
        .robos-back-home {
          position: fixed;
          top: 12px;
          right: 16px;
          z-index: 9999;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          white-space: nowrap;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          /* Verde fluorescente padrão */
          background: #18e273;
          color: #052515;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.8),
            inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .robos-back-home:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1),
            inset 0 0 16px rgba(24, 226, 115, 0.7);
        }

        @media (max-width: 640px) {
          .robos-back-home {
            top: 10px;
            right: 10px;
            height: 36px;
            padding: 0 16px;
          }
        }
      `}</style>
    </>
  );
}
