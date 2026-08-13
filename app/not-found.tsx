"use client";
import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";

export default function NotFound() {
  const { locale, t } = useI18n();
  return (
    <main className="wrapper" style={{ gridTemplateColumns: "1fr" }}>
      <section className="panel hero" style={{ minHeight: "60dvh" }}>
        <div className="heroInner">
          <div className="heroTag">404</div>
          <h1 className="heroTitle">{locale === "en" ? "Page not found." : locale === "es" ? "Página no encontrada." : "Página não encontrada."}</h1>
          <p className="heroSubtitle">
            {locale === "en" ? "The link may have changed or may still be under construction." : locale === "es" ? "El enlace puede haber cambiado o seguir en construcción." : "O link pode ter mudado ou ainda está em construção."}
          </p>
          <p>
            <Link href="/" className="menuBtn active">{t("actions.backHome")}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
