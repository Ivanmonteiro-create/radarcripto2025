// app/sobre/page.tsx
import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel">
        <h1>Sobre</h1>
        <p>O RadarCrypto é um simulador prático para testar estratégias sem risco.</p>
        <p className="small muted">Conteúdo completo em breve.</p>
        <p style={{marginTop:20}}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </p>
      </section>
    </main>
  );
}
