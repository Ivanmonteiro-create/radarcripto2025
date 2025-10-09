// app/page.tsx
import React from "react";

export default function Home() {
  return (
    <main className="rc-home">
      {/* top coins tray */}
      <div className="top-coins" aria-hidden>
        {["ADA/USDT","BTC/USDT","ETH/USDT","SOL/USDT","LINK/USDT","BNB/USDT","XRP/USDT","DOGE/USDT"].map((c) => (
          <div className="coin-chip" key={c}>
            <div style={{fontSize: 12, opacity: 0.9}}>{c}</div>
            <div style={{fontWeight: 700, color: "var(--rc-green)", marginTop: 6}}>123.45</div>
          </div>
        ))}
      </div>

      {/* linha verde separadora */}
      <div className="hero-line" />

      {/* content: hero card + cta buttons */}
      <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div className="hero-card">
          <h1 style={{ fontSize: 48, margin: 0, lineHeight: 1 }}>
            Aprenda trading na prática,<br/>sem arriscar um centavo.
          </h1>
        </div>

        <div className="cta-buttons" aria-hidden>
          <button className="rc-cta">Simulador</button>
          <button className="rc-cta">Robôs (SIM)</button>
          <button className="rc-cta">Planos</button>
          <button className="rc-cta">Sobre</button>
          <button className="rc-cta">Fale com a gente</button>
        </div>
      </div>

      {/* filler */}
      <div style={{ height: 120 }} />
    </main>
  );
}
