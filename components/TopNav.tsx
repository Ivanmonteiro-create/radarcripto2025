// components/TopNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BackHomeButton from "@/components/navigation/BackHomeButton";
import LanguageSelector from "@/components/navigation/LanguageSelector";
import { useI18n } from "@/components/i18n/LocaleProvider";

const PRIMARY_LINKS = [
  { href: "/#visao-mercado", key: "navigation.market" }, { href: "/robos", key: "navigation.robots" },
  { href: "/radar-ia", key: "navigation.ai" }, { href: "/noticias", key: "navigation.news" },
  { href: "/listagens", key: "navigation.listings" }, { href: "/#estrategias", key: "navigation.strategies" },
] as const;

const SECONDARY_LINKS = [
  { href: "/simulador", key: "navigation.simulator" }, { href: "/planos", key: "navigation.plans" },
  { href: "/sobre", key: "navigation.about" }, { href: "/fale-com-agente", key: "navigation.contact" },
] as const;

export default function TopNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const onHome = pathname === "/";

  return (
    <>
      <nav className="rc-topnav" aria-label={t("navigation.main")}>
        <div className="rc-topnav__inner">
          {onHome &&
            PRIMARY_LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rc-pill ${active ? "is-active" : ""}`}
                >
                  {t(l.key)}
                </Link>
              );
            })}
        </div>
        {onHome && <div className="rc-topnav__secondary">
          {SECONDARY_LINKS.map((link) => <Link key={link.href} href={link.href}>{t(link.key)}</Link>)}
        </div>}
        <div className="rc-topnav__utilities">
          {onHome ? <><Link href="/login" className="rc-login-link">{t("actions.login")}</Link><LanguageSelector /></> : <BackHomeButton />}
        </div>
      </nav>
    </>
  );
}
