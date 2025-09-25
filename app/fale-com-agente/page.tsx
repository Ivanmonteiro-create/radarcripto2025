// app/fale-com-a-gente/page.tsx
import Link from "next/link";
import RadarBackground from "@/components/RadarBackground";

export const metadata = {
  title: "Fale com a gente • RadarCripto",
  description:
    "Canais oficiais de contato do RadarCripto. Em breve: WhatsApp Business e e-mail de suporte.",
};

export default function FalePage() {
  return (
    <main
      className="panel"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      {/* Fundo animado (radar) */}
      <RadarBackground
        size={760}         // maior e central
        sweepWidth={3.2}   // feixe um pouco mais “aceso”
        glow={0.9}         // brilho do rastro
        ringOpacity={0.18}
        crossOpacity={0.14}
        accent="#1cff80"
      />

      {/* Botão voltar ao início — topo direito */}
      <Link
        href="/"
        className="btn btn-primary"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 5,
          padding: "10px 16px",
          borderRadius: 12,
          fontWeight: 800,
        }}
      >
        Voltar ao início
      </Link>

      {/* Conteúdo */}
      <div
        className="panel"
        style={{
          width: "min(980px, 95vw)",
          background:
            "radial-gradient(1000px 800px at -15% -20%, rgba(33,243,141,.06), transparent 40%), rgba(15,21,19,.92)",
          border: "1px solid rgba(33,243,141,.25)",
          boxShadow: "0 0 0 6px rgba(33,243,141,.06) inset",
        }}
      >
        {/* Cabeçalho */}
        <header style={{ marginBottom: 16 }}>
          <div
            className="heroTag"
            style={{ letterSpacing: ".22em", color: "var(--muted)" }}
          >
            FALE COM A GENTE
          </div>
          <h1
            style={{
              margin: "6px 0 8px",
              fontSize: "clamp(26px, 4.8vw, 56px)",
              lineHeight: 1.06,
              fontWeight: 900,
              color: "#d5fbe6",
              textShadow:
                "0 0 18px rgba(33,243,141,.35), 0 0 4px rgba(33,243,141,.35)",
            }}
          >
            Quer falar com nossa equipe?
          </h1>
          <p
            style={{
              margin: 0,
              color: "rgba(213,251,230,.88)",
              maxWidth: 720,
              fontSize: "clamp(14px, 1.8vw, 16px)",
            }}
          >
            Estamos finalizando os canais oficiais. Em breve você poderá chamar no
            WhatsApp ou enviar um e-mail para suporte.
          </p>
        </header>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {/* WhatsApp */}
          <section
            className="panel"
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(33,243,141,.35)",
              boxShadow: "0 0 0 4px rgba(33,243,141,.06) inset",
            }}
          >
            <div
              className="chip-active"
              style={{
                display: "inline-block",
                padding: "7px 10px",
                borderRadius: 999,
                fontWeight: 800,
              }}
            >
              WhatsApp (em breve)
            </div>

            <p className="muted" style={{ marginTop: 8 }}>
              Atenderemos por WhatsApp Business assim que o número dedicado estiver
              ativo.
            </p>

            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              <label className="lbl">Site:</label>
              <input
                className="inp inp-disabled"
                disabled
                value="radarcripto.space"
                readOnly
              />
              <button className="btn" disabled>
                Abrir WhatsApp
              </button>
            </div>
          </section>

          {/* E-mail */}
          <section
            className="panel"
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(33,243,141,.35)",
              boxShadow: "0 0 0 4px rgba(33,243,141,.06) inset",
            }}
          >
            <div
              className="chip-active"
              style={{
                display: "inline-block",
                padding: "7px 10px",
                borderRadius: 999,
                fontWeight: 800,
              }}
            >
              E-mail (em breve)
            </div>

            <p className="muted" style={{ marginTop: 8 }}>
              Teremos um endereço <b>suporte@radarcripto.space</b> para suporte e
              dúvidas.
            </p>

            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              <label className="lbl">Endereço:</label>
              <input
                className="inp inp-disabled"
                disabled
                value="suporte@radarcripto.space"
                readOnly
              />
              <button className="btn" disabled>
                Enviar e-mail
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
