// app/simulador/page.tsx
import Link from "next/link";
import SimPageClient from "./SimPageClient";

export const metadata = {
  title: "Simulador | RadarCrypto",
};
// /app/simulador/page.tsx
import SimPageClient from './SimPageClient';

export default function Page() {
  // A page é “fina”: só orquestra. Nada de dynamic/ssr:false aqui.
  return (
    <main className="aboutV2-root" style={{ paddingTop: 12 }}>
      <Link href="/" className="btn backTopRight tcBackBtn">
        Voltar ao início
      </Link>
      <SimPageClient />
    </main>
  );
  return <SimPageClient />;
