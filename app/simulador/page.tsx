// app/simulador/page.tsx (trecho do painel à direita)
import Link from "next/link";

export default function SimuladorPage() {
  return (
    <div className="rc-sim">
      <div className="rc-sim__grid">
        {/* ... seu componente do gráfico ... */}

        <aside className="rc-sim__panel">
          <header className="rc-sim__panelHead">
            <h2>Controles de Trade</h2>
            <Link href="/" className="rc-btn rc-btn--green">
              Voltar ao início
            </Link>
          </header>

          {/* ... seus controles (inputs, botões Comprar/Vender etc.) ... */}
        </aside>
      </div>
    </div>
  );
}
