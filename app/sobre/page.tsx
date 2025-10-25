// app/sobre/page.tsx
"use client";

import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="page-sobre min-h-screen w-full flex flex-col items-center bg-black text-white px-6 py-16">
      {/* Barra de ação (direita) */}
      <div className="w-full max-w-5xl flex justify-end">
        <Link
          href="/"
          className="rc-btn rc-btn--green"
          aria-label="Voltar ao início"
        >
          Voltar ao início
        </Link>
      </div>

      {/* Cabeçalho */}
      <header className="w-full max-w-5xl text-center mt-6">
        <h1 className="rc-title">SOBRE O RADARCRYPTO</h1>

        <p className="rc-sub mx-auto mt-3 max-w-3xl">
          Onde o aprendizado encontra a prática — e o risco fica de fora.
        </p>

        <p className="mx-auto mt-4 max-w-3xl text-gray-300 leading-relaxed">
          O RadarCrypto nasceu com um propósito simples:{" "}
          <strong className="text-white">
            ajudar pessoas a aprender trading sem perder dinheiro real
          </strong>
          . Aqui, você erra, aprende, ajusta e evolui — tudo dentro de um{" "}
          <strong className="text-white">ambiente virtual seguro</strong>,
          moderno e acessível.
        </p>
      </header>

      {/* Cards principais */}
      <section className="w-full max-w-5xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="rc-card">
          <h3 className="rc-card-title">Erre sem riscos</h3>
          <p className="rc-card-text">
            Treine estratégias no simulador com{" "}
            <strong className="text-white">10.000 USDT virtuais</strong> e
            descubra como o mercado se comporta —{" "}
            <strong className="text-white">sem arriscar um centavo</strong>.
          </p>
        </article>

        <article className="rc-card">
          <h3 className="rc-card-title">Aprenda de verdade</h3>
          <p className="rc-card-text">
            Experimente operações no <strong className="text-white">Spot</strong>{" "}
            ou <strong className="text-white">Futuro</strong>, pratique leitura
            de gráficos e desenvolva controle emocional — é{" "}
            <strong className="text-white">escola de prática real</strong>.
          </p>
        </article>

        <article className="rc-card">
          <h3 className="rc-card-title">Evolua sempre</h3>
          <p className="rc-card-text">
            Revise seus resultados, teste novas ideias e acompanhe sua
            performance com clareza. Quanto mais você pratica, mais se prepara
            para o mercado real.
          </p>
        </article>
      </section>

      {/* Destaque curto (sem CTA) */}
      <section className="w-full max-w-5xl text-center mt-12">
        <p className="text-[#18e273] font-semibold">
          +2.000 traders já começaram por aqui.
        </p>
      </section>

      {/* Estilos locais (mantém a identidade atual) */}
      <style jsx>{`
        .rc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          padding: 0 18px;
          border-radius: 999px;
          font-weight: 800;
          text-decoration: none;
          line-height: 1;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .rc-btn--green {
          background: #18e273 !important;
          color: #052515 !important;
          box-shadow: 0 0 18px rgba(24, 226, 115, 0.8),
            inset 0 0 10px rgba(24, 226, 115, 0.5);
        }
        .rc-btn--green:hover {
          filter: brightness(1.35);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(24, 226, 115, 1),
            inset 0 0 16px rgba(24, 226, 115, 0.7);
        }

        .rc-title {
          font-size: clamp(28px, 3.2vw, 44px);
          font-weight: 900;
          letter-spacing: 0.2px;
          color: #18e273;
          text-transform: uppercase;
        }
        .rc-sub {
          color: #c9f7df;
          font-size: clamp(15px, 1.4vw, 18px);
          opacity: 0.95;
        }

        .rc-card {
          border: 1px solid rgba(24, 226, 115, 0.35);
          background: rgba(8, 24, 16, 0.45);
          border-radius: 18px;
          padding: 18px;
          transition: background 160ms ease, box-shadow 160ms ease,
            transform 160ms ease;
          box-shadow: inset 0 0 0 1px rgba(24, 226, 115, 0.1);
        }
        .rc-card:hover {
          background: rgba(8, 24, 16, 0.6);
          box-shadow: 0 0 22px rgba(24, 226, 115, 0.4);
          transform: translateY(-2px);
        }
        .rc-card-title {
          color: #18e273;
          font-weight: 800;
          font-size: clamp(18px, 1.8vw, 20px);
          margin-bottom: 8px;
        }
        .rc-card-text {
          color: #d9fbe9;
          line-height: 1.55;
        }

        @media (max-width: 768px) {
          .page-sobre {
            padding-top: 22px;
          }
        }
      `}</style>
    </main>
  );
}
