// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LOCALE_COOKIE, localeTag, normalizeLocale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "RadarCrypto — Inteligência, informação e automação cripto",
  description:
    "Mercado, robôs, estratégias e ferramentas de informação cripto em uma única plataforma experimental.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <html lang={localeTag[locale]}>
      <body className="rc-root">
        <LocaleProvider initialLocale={locale}><TopNav /><main className="rc-main">{children}</main></LocaleProvider>
      </body>
    </html>
  );
}
