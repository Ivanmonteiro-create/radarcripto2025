// app/robos/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Robôs (SIM) — RadarCrypto",
};

export default function RobosLayout({ children }: { children: ReactNode }) {
  return (
    <section className="page-robos">
      {/* Conteúdo original da rota /robos */}
      {children}

      {/* CSS escopado apenas para /robos */}
      <style>{`
        /* 1) Some com a faixa preta de topo (qualquer .rc-backtop nessa rota) */
        .page-robos .rc-backtop{
          display: none !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        /* 2) Remove o botão verde "Voltar ao início" da direita nesta página
              (âncora com href="/", sem afetar Iniciar/Habilitar que são <button>) */
        .page-robos a.rc-btn--green[href="/"]{
          display: none !important;
        }

        /* 3) Zera qualquer sobra de “top strip” relacionada */
        .page-robos .rc-topbar,
        .page-robos .rc-topstrip,
        .page-robos .rc-page-top{
          display: none !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
    </section>
  );
}
