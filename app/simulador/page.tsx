// app/simulador/page.tsx
import Link from "next/link";

export default function SimuladorPage() {
  return (
    <main className="container section">
      {/* Cabeçalho: título e botão à direita */}
      <header className="rc-pagebar">
        <h1 className="rc-pagebar__title">Controles de Trade</h1>
        <Link href="/" className="rc-btn rc-btn--green">
          Voltar ao início
        </Link>
      </header>

      {/* Aqui abaixo entra o seu conteúdo original do simulador */}
      <div className="simulator-container">
        {/* Exemplo de placeholder – mantenha ou substitua pelo seu conteúdo real */}
        <p className="text-gray-400">Gráfico e controles do simulador aqui...</p>
      </div>
    </main>
  );
}
