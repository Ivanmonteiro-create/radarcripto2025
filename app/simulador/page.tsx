"use client";

import Link from "next/link";
import TradingViewWidget from "@/components/TradingViewWidget";

export default function SimuladorPage() {
  return (
    <div className="flex flex-col items-stretch justify-center bg-transparent">
      <TradingViewWidget />
      <div className="flex justify-center mt-4">
        <Link href="/" className="rc-btn rc-btn--green">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
