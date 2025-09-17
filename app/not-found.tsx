// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel hero" style={{ minHeight: "60dvh" }}>
        <div className="heroInner">
          <div className="heroTag">Erro 404</div>
          <h1 className="heroTitle">Página não encontrada.</h1>
          <p className="heroSubtitle">
            O link pode ter mudado ou ainda está em construção.
          </p>
          <p>
            <Link href="/" className="menuBtn active">Voltar ao início</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
