// app/planos/page.tsx
'use client';

import Link from 'next/link';

type Plan = {
  id: string;
  nome: string;
  destaque?: string;
  preco: string;        // placeholder por enquanto
  periodicidade: string; // ex.: /mês
  cta: string;
  features: string[];
  bloqueios?: string[]; // itens que ficam bloqueados no plano
  recomendado?: boolean;
};

const planos: Plan[] = [
  {
    id: 'free',
    nome: 'Starter',
    destaque: 'Para começar',
    preco: 'Grátis',
    periodicidade: '',
    cta: 'Acessar simulador',
    features: [
      'Simulador Spot básico',
      'Saldo inicial: 10.000 USDT virtuais',
      '8 pares principais',
      'Histórico de operações',
      'Tela cheia e gráfico TradingView',
    ],
    bloqueios: [
      'Stop/Take Profit automáticos',
      'Gestão de risco por trade',
      'Robô trader',
      'Módulo de Futuros (alavancagem)',
      'Ranking e relatórios avançados',
    ],
  },
  {
    id: 'basic',
    nome: 'Trader',
    destaque: 'Evolua suas entradas',
    preco: '€19',
    periodicidade: '/mês',
    cta: 'Em breve',
    features: [
      'Tudo do Starter',
      'Stop Loss e Take Profit (manuais/assistidos)',
      'Gestão de risco por trade (%)',
      'Mais pares liberados',
      'Suporte prioritário por e-mail',
    ],
    bloqueios: [
      'Robô trader',
      'Módulo de Futuros (alavancagem)',
      'Ranking e relatórios avançados',
    ],
    recomendado: true,
  },
  {
    id: 'pro',
    nome: 'Pro',
    destaque: 'Para acelerar',
    preco: '€39',
    periodicidade: '/mês',
    cta: 'Em breve',
    features: [
      'Tudo do Trader',
      'Módulo de Futuros (alavancagem)',
      'PNL flutuante avançado',
      '1 estratégia de Robô (Médias Móveis)',
      'Exportar histórico (CSV)',
    ],
    bloqueios: [
      'Múltiplos robôs e personalização',
      'Ranking mensal',
      'Relatórios PDF de performance',
    ],
  },
  {
    id: 'master',
    nome: 'Elite',
    destaque: 'Tudo desbloqueado',
    preco: '€79',
    periodicidade: '/mês',
    cta: 'Em breve',
    features: [
      'Tudo do Pro',
      'Múltiplas estratégias de Robô',
      'Parâmetros customizáveis dos Robôs',
      'Ranking mensal e gamificação',
      'Relatórios PDF e insights',
    ],
  },
];

export default function PlanosPage() {
  return (
    <main className="wrapper" style={{ gridTemplateColumns: '1fr', maxWidth: 1200, marginInline: 'auto' }}>
      <section className="panel" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <span className="heroTag">Planos</span>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, fontWeight: 900 }}>
            Escolha seu caminho no Radar Cripto
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Comece no <strong>Spot</strong> com 10.000 USDT virtuais. Evolua para <strong>gestão de risco</strong>,
            <strong> Futuros</strong> e <strong>Robôs</strong> conforme o plano.
          </p>
        </header>

        {/* Tabela responsiva de planos */}
        <div className="gridPlans">
          {planos.map((p) => (
            <article
              key={p.id}
              className={`planCard ${p.recomendado ? 'planCard--highlight' : ''}`}
              aria-label={`Plano ${p.nome}`}
            >
              {p.destaque && <div className="badge">{p.destaque}</div>}
              <h3 className="planTitle">{p.nome}</h3>

              <div className="priceRow">
                <div className="price">
                  <span className="priceValue">{p.preco}</span>
                  {p.periodicidade && <span className="period">{p.periodicidade}</span>}
                </div>
              </div>

              <ul className="featList">
                {p.features.map((f, i) => (
                  <li key={`ok-${i}`} className="ok">
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
                {p.bloqueios?.map((b, i) => (
                  <li key={`no-${i}`} className="no">
                    <LockIcon />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="ctaRow">
                {p.id === 'free' ? (
                  <Link href="/simulador" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                    {p.cta}
                  </Link>
                ) : (
                  <button className="btn" style={{ width: '100%' }} disabled>
                    {p.cta}
                  </button>
                )}
              </div>

              {/* Observação simples */}
              {p.id === 'free' && (
                <p className="small muted" style={{ marginTop: 8 }}>
                  * Sem necessidade de cartão. Recursos avançados ficam desabilitados.
                </p>
              )}
            </article>
          ))}
        </div>

        {/* Voltar ao início */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Link href="/" className="btn btn-primary">Voltar ao início</Link>
        </div>

        {/* styles locais (não mexe no globals.css) */}
        <style jsx>{`
          .gridPlans{
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }
          @media (max-width: 1200px){
            .gridPlans{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 640px){
            .gridPlans{ grid-template-columns: 1fr; }
          }
          .planCard{
            position: relative;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 14px;
            background: rgba(255,255,255,.03);
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-height: 100%;
          }
          .planCard--highlight{
            outline: 2px solid var(--accent);
            box-shadow: 0 0 0 6px rgba(33,243,141,.10) inset;
          }
          .badge{
            position: absolute;
            top: 12px; right: 12px;
            font-size: 11px;
            letter-spacing: .06em;
            text-transform: uppercase;
            padding: 6px 8px;
            border-radius: 999px;
            background: rgba(33,243,141,.18);
            border: 1px solid rgba(33,243,141,.35);
            color: var(--accent-strong);
            font-weight: 800;
          }
          .planTitle{
            margin: 0;
            font-size: 18px;
            font-weight: 900;
          }
          .priceRow{ display: flex; align-items: baseline; gap: 8px; }
          .price{ display: flex; align-items: baseline; gap: 6px; }
          .priceValue{ font-size: 28px; font-weight: 900; }
          .period{ font-size: 13px; opacity: .8; }

          .featList{
            list-style: none;
            margin: 0; padding: 0;
            display: grid; gap: 8px;
          }
          .featList li{
            display: grid;
            grid-template-columns: 18px 1fr;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }
          .featList li.ok{ color: #dfffea; }
          .featList li.no{ color: rgba(255,255,255,.6); }
          .featList li.no span{ opacity: .8; }

          .ctaRow{ margin-top: auto; }
        `}</style>
      </section>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
