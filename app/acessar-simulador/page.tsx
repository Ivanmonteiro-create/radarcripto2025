import Link from "next/link";
export default function AcessarSimuladorPage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel">
        <h1>Acessar simulador</h1>
        <p>O simulador já está disponível na rota <code>/simulador</code>.</p>
        <p><Link className="menuBtn active" href="/simulador">Ir para o simulador</Link></p>
      </section>
    </main>
  );
}
