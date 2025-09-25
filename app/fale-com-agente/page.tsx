import Link from "next/link";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

export const metadata = {
  title: `Fale com a gente — ${BRAND_NAME}`,
  description:
    "Entre em contato com a equipe do RadarCripto. Em breve: WhatsApp e e-mail dedicados.",
};

export default function FaleComAGentePage() {
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 16,
        minHeight: "100dvh",
        display: "grid",
        alignItems: "start",
      }}
    >
      <section className="panel" style={{ padding: 18 }}>
        {/* título */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>
            Fale com a gente
          </h1>

          {/* voltar */}
          <Link href="/" className="btn btn-primary" aria-label="Voltar ao início">
            Voltar ao início
          </Link>
        </div>

        {/* intro */}
        <p style={{ marginTop: 0, marginBottom: 18, opacity: 0.9 }}>
          Quer falar com nossa equipe? Estamos finalizando os canais oficiais.
          Em breve você poderá chamar no WhatsApp ou enviar um e-mail dedicado.
        </p>

        {/* grade de contatos */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {/* WhatsApp (placeholder) */}
          <div className="panel" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   aria-hidden="true">
                <path d="M20.52 3.48A11.5 11.5 0 0 0 3.5 20.5L2 22l1.5-.5A11.5 11.5 0 1 0 20.5 3.5z" />
                <path d="M8 12c1.5 3 4 5 7 6l1-2c.2-.4.1-.9-.3-1.2l-1.6-1a1 1 0 0 0-1.1.1l-.7.5a9 9 0 0 1-3-3l.5-.7c.3-.3.3-.8.1-1.1l-1-1.6c-.3-.4-.8-.5-1.2-.3L7 8" />
              </svg>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>WhatsApp (em breve)</h3>
            </div>

            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.9 }}>
              Atenderemos por WhatsApp Business assim que o número dedicado estiver ativo.
            </p>

            <button
              className="btn"
              aria-disabled="true"
              title="Em breve"
              style={{
                width: "100%",
                cursor: "not-allowed",
                opacity: 0.6,
                pointerEvents: "none",
              }}
            >
              Abrir WhatsApp
            </button>
          </div>

          {/* E-mail (placeholder) */}
          <div className="panel" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   aria-hidden="true">
                <path d="M4 4h16v16H4z" />
                <path d="m22 6-10 7L2 6" />
              </svg>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>E-mail (em breve)</h3>
            </div>

            <p style={{ marginTop: 0, marginBottom: 12, opacity: 0.9 }}>
              Teremos um endereço @radarcripto.space para suporte e dúvidas.
            </p>

            <button
              className="btn"
              aria-disabled="true"
              title="Em breve"
              style={{
                width: "100%",
                cursor: "not-allowed",
                opacity: 0.6,
                pointerEvents: "none",
              }}
            >
              Enviar e-mail
            </button>
          </div>
        </div>

        {/* rodapézinho informativo */}
        <div style={{ marginTop: 16, opacity: 0.8, fontSize: 14 }}>
          Site:{" "}
          <a href={BRAND_URL} target="_blank" rel="noopener noreferrer" className="menuBtn" style={{ padding: "4px 8px" }}>
            {BRAND_URL.replace("https://", "")}
          </a>
        </div>
      </section>
    </main>
  );
}
