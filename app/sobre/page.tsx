// app/sobre/page.tsx
'use client';

import Link from 'next/link';
import { BRAND_NAME } from '@/lib/brand';

export default function SobrePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      {/* Tag e botão no topo */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs tracking-widest text-gray-400 border border-gray-700 rounded-full px-3 py-1">
          SOBRE
        </span>
        <Link
          href="/"
          className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg transition"
        >
          Voltar ao início
        </Link>
      </div>

      {/* Título + subtítulo */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-b from-green-100 to-green-500 bg-clip-text text-transparent drop-shadow-lg">
          SOBRE O {BRAND_NAME.toUpperCase()}
        </h1>
        <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
          {BRAND_NAME} é onde você erra, aprende e evolui. Treine no Spot ou no Futuro
          com saldo virtual e prepare-se para ganhar confiança no mercado real.
        </p>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg backdrop-blur">
          <h3 className="text-green-400 font-bold mb-2">Errar sem riscos</h3>
          <p className="text-gray-300">
            Simulador com <strong>10.000 USDT</strong> virtuais para testar ideias sem
            arriscar dinheiro real.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg backdrop-blur">
          <h3 className="text-green-400 font-bold mb-2">Aprender de verdade</h3>
          <p className="text-gray-300">
            Pratique <strong>Spot</strong> e <strong>Futuros</strong> com as mesmas
            noções de risco do dia a dia.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg backdrop-blur">
          <h3 className="text-green-400 font-bold mb-2">Evoluir sempre</h3>
          <p className="text-gray-300">
            Ganhe confiança antes de operar no real. Ajuste estratégias e acompanhe sua
            evolução no histórico.
          </p>
        </div>
      </div>
    </main>
  );
}
