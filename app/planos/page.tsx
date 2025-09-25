// app/planos/page.tsx
"use client";

import Link from "next/link";

export default function PlanosPage() {
  return (
    <main className="wrapper">
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        {/* Botão global no topo */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/" className="btn btn-primary">
            Voltar ao início
          </Link>
        </div>

        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>
          Escolha seu Plano
        </h1>
        <p style={{ textAlign: "center", marginBottom: "40px", color: "#8fbfa8" }}>
          Preço promocional para membros fundadores — garanta já o seu acesso.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Starter */}
          <div className="panel" style={{ textAlign: "center" }}>
            <h2>Starter</h2>
            <p className="muted">Grátis para começar</p>
            <p style={{ fontSize: "26px", fontWeight: "900", margin: "12px 0" }}>
              €0,00
            </p>
            <p style={{ fontSize: "13px", color: "#8fbfa8" }}>
              Acesse o simulador com saldo inicial de treino.
            </p>
            <p className="chip-active" style={{ marginTop: "10px" }}>
              Fundadores
            </p>
          </div>

          {/* Trader */}
          <div className="panel" style={{ textAlign: "center" }}>
            <h2>Trader</h2>
            <p className="muted">Plano inicial pago</p>
            <p style={{ fontSize: "26px", fontWeight: "900", margin: "12px 0" }}>
              €9,99 <span style={{ fontSize: "14px" }}>/mês</span>
            </p>
            <p style={{ fontSize: "13px", color: "#8fbfa8" }}>
              Operações spot ilimitadas, relatórios básicos e ranking.
            </p>
            <p className="chip-active" style={{ marginTop: "10px" }}>
              Preço promocional — Fundadores
            </p>
          </div>

          {/* Pro */}
          <div className="panel" style={{ textAlign: "center" }}>
            <h2>Pro</h2>
            <p className="muted">Plano intermediário</p>
            <p style={{ fontSize: "26px", fontWeight: "900", margin: "12px 0" }}>
              €19,99 <span style={{ fontSize: "14px" }}>/mês</span>
            </p>
            <p style={{ fontSize: "13px", color: "#8fbfa8" }}>
              Inclui robôs configuráveis, mais pares de moedas e relatórios avançados.
            </p>
            <p className="chip-active" style={{ marginTop: "10px" }}>
              Preço promocional — Fundadores
            </p>
          </div>

          {/* Elite */}
          <div className="panel" style={{ textAlign: "center" }}>
            <h2>Elite</h2>
            <p className="muted">Plano completo</p>
            <p style={{ fontSize: "26px", fontWeight: "900", margin: "12px 0" }}>
              €29,99 <span style={{ fontSize: "14px" }}>/mês</span>
            </p>
            <p style={{ fontSize: "13px", color: "#8fbfa8" }}>
              Tudo liberado: spot + futuros, robôs premium, relatórios detalhados e suporte prioritário.
            </p>
            <p className="chip-active" style={{ marginTop: "10px" }}>
              Preço promocional — Fundadores
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
