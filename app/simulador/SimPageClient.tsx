// app/simulador/SimPageClient.tsx
"use client";
import React from "react";

export default function SimPageClient() {
  return (
    <div className="sim-container" style={{ display: "flex", gap: 18 }}>
      <div style={{ flex: 1 }}>
        {/* placeholder chart */}
        <div style={{ height: 360, borderRadius: 12, background: "linear-gradient(180deg,#07110b,#0c2218)" }} />
      </div>

      <aside className="trade-panel" style={{ width: 420 }}>
        <div style={{ background: "rgba(0,0,0,0.22)", padding: 18, borderRadius: 12 }}>
          <h3>Controles de Trade</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <input placeholder="Preço ao vivo" />
            <input placeholder="Tamanho (USDT)" />
            <button style={{ padding: 10, background: "var(--rc-green)", borderRadius: 10 }}>Comprar</button>
            <button style={{ padding: 10, background: "#b32d2d", borderRadius: 10 }}>Vender</button>
          </div>
        </div>
      </aside>

      <button className="btn-go-top">Voltar ao início</button>
    </div>
  );
}
