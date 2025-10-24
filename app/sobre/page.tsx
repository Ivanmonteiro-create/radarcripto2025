"use client";

import Link from "next/link";

export default function SobrePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6 py-16">
      <section className="max-w-5xl w-full text-center space-y-8">
        <div className="flex justify-end">
          <Link
            href="/"
            className="bg-[#18e273] text-black font-semibold px-4 py-2 rounded-full hover:opacity-90 transition"
          >
            Voltar ao início
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-[#18e273] uppercase tracking-wide mt-4">
          SOBRE O RADARCRYPTO
        </h1>
        <p className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
          Onde o aprendizado encontra a prática — e o risco fica de fora.
        </p>

        <p className="text-gray-400 max-w-3xl mx-auto leading-relaxed">
          O RadarCrypto nasceu com um propósito simples:{" "}
          <strong className="text-white">
            ajudar pessoas a aprender trading sem perder dinheiro real.
          </strong>{" "}
          Aqui, você erra, aprende, ajusta e evolui — tudo dentro de um ambiente
          virtual seguro, moderno e acessível.
        </p>

        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="border border-[#18e273] rounded-2xl p-6 text-left bg-black/40 hover:bg-black/60 transition">
            <h3 className="text-xl font-semibold text-[#18e273] mb-3">
              Erre sem riscos
            </h3>
            <p className="text-gray-300">
              Treine estratégias no simulador com{" "}
              <strong className="text-white">10.000 USDT virtuais</strong> e
              descubra como o mercado se comporta —{" "}
              <strong className="text-white">sem arriscar um centavo</strong>.
            </p>
          </div>

          <div className="border border-[#18e273] rounded-2xl p-6 text-left bg-black/40 hover:bg-black/60 transition">
            <h3 className="text-xl font-semibold text-[#18e273] mb-3">
              Aprenda de verdade
            </h3>
            <p className="text-gray-300">
              Experimente operações no{" "}
              <strong className="text-white">Spot</strong> ou{" "}
              <strong className="text-white">Futuro</strong>, pratique leitura
              de gráficos e desenvolva controle emocional — o RadarCrypto é{" "}
              <strong className="text-white">sua escola de prática real</strong>.
            </p>
          </div>

          <div className="border border-[#18e273] rounded-2xl p-6 text-left bg-black/40 hover:bg-black/60 transition">
            <h3 className="text-xl font-semibold text-[#18e273] mb-3">
              Evolua sempre
            </h3>
            <p className="text-gray-300">
              Revise seus resultados, teste novas ideias e acompanhe sua
              performance com clareza. Quanto mais você pratica, mais se prepara
              para o mercado real.
            </p>
          </div>
        </div>

        {/* Novo bloco - Nosso propósito */}
        <div className="max-w-3xl mx-auto text-center mt-14 space-y-5">
          <h2 className="text-2xl font-semibold text-[#18e273]">
            Nosso propósito
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Acreditamos que todo trader merece{" "}
            <strong className="text-white">
              aprender com liberdade e consciência
            </strong>
            , e não com perdas. Por isso, criamos uma ferramenta que une{" "}
            <strong className="text-white">
              simulação, estratégia e evolução contínua
            </strong>{" "}
            — um ambiente para treinar como profissional, sem o peso do risco.
          </p>

          <p className="text-[#18e273] font-medium text-lg mt-8">
            +2.000 traders já começaram por aqui.
          </p>

          <Link
            href="/simulador"
            className="inline-block bg-[#18e273] text-black font-semibold px-6 py-3 rounded-full mt-4 hover:opacity-90 transition"
          >
            Começar no simulador
          </Link>
        </div>
      </section>
    </main>
  );
}
