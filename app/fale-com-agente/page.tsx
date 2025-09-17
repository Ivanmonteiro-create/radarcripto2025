// app/fale-com-agente/page.tsx
import Link from "next/link";

export default function FalePage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel">
        <h1>Fale com a gente</h1>
        <p className="small muted">Canal de contato em breve.</p>
        <p style={{marginTop:20}}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </p>
      </section>
    </main>
  );
}
