// /app/simulador/page.tsx
import SimPageClient from './SimPageClient';
// app/simulador/page.tsx
import Link from "next/link";

export default function SimuladorPage() {
  return (
    <section className="container section">
      {/* Barra de título + botão à direita */}
      <header className="rc-pagebar">
        <h1 className="rc-pagebar__title">Controles de Trade</h1>
        <Link href="/" className="rc-btn rc-btn--green">Voltar ao início</Link>
      </header>

      {/* ---- seu conteúdo atual do simulador abaixo ---- */}
      {/* <Grafico /> */}
      {/* <TradeControls /> */}
    </section>
  );
}
export default function Page() {
  return <SimPageClient />;
}
