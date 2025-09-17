// app/planos/page.tsx
import Link from "next/link";

export default function PlanosPage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel">
        <h1>Planos</h1>
        <p className="small muted">Em breve.</p>
        <p style={{marginTop:20}}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </p>
      </section>
    </main>
  );
}
