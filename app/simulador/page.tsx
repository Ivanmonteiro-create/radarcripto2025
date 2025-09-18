/* app/simulador/page.tsx — mantém seu layout, só garante .simWrap */
'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Se você já tem um componente de gráfico (TVWidget), mantenha como estava:
const TVChart = dynamic(() => import('../../components/TVChart'), { ssr: false });
// E seus controles:
import TradeControls from '../../components/TradeControls';

export default function SimuladorPage() {
  return (
    <main className="wrapper simWrap">
      {/* Gráfico grande (coluna central ocupando) */}
      <section className="panel" style={{ position: 'relative' }}>
        <TVChart />
        {/* Botões posicionados que seu globals.css conhece */}
        <button className="chartFsBtn" title="Tela cheia" aria-label="Tela cheia">⛶</button>
        <div className="graphTopBar">
          {/* seus ícones/indicadores, se estiverem sendo usados */}
        </div>
      </section>

      {/* Painel de controles (coluna direita) */}
      <aside className="rightMenu">
        <div className="panel compactPanel">
          <header className="compactHeader">
            <h2 className="compactTitle">Controles de Trade</h2>
            <Link href="/" className="btn btn-primary">Voltar ao início</Link>
          </header>
          <TradeControls />
        </div>
      </aside>

      {/* Coluna esquerda vazia ou histórico breve, se preferir
          (se não usar, pode remover) */}
      <aside className="leftPanel">
        <div className="panel">
          <div className="muted small">Histórico ou atalhos…</div>
        </div>
      </aside>
    </main>
  );
}
