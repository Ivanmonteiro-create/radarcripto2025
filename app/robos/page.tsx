// app/robos/page.tsx
"use client";

import BotRunnerClient from "@/components/bots/BotRunnerClient";

export default function RobosPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-black text-green-400 p-6"
    >
      <h1 className="text-3xl font-bold mb-6 text-center">
        Robôs de Trading (Modo Simulado)
      </h1>
      <p className="text-sm text-green-300 mb-6 text-center max-w-lg">
        Aqui você pode testar estratégias automáticas em tempo real usando
        dados ao vivo, sem arriscar nada. Este é o modo <b>SIM</b> (simulação
        local).
      </p>

      <div className="w-full max-w-4xl bg-[#0b0b0b] border border-green-500/30 rounded-2xl p-6 shadow-lg">
        <BotRunnerClient />
      </div>
    </main>
  );
}
