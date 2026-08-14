import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n/config";
import { dictionaries, pt, translate } from "@/lib/i18n/dictionaries";
import { pageContent } from "@/lib/i18n/pageContent";
import { readFile } from "node:fs/promises";

describe("global i18n", () => {
  it("defaults unknown and absent preferences safely to Portuguese", () => {
    expect(DEFAULT_LOCALE).toBe("pt");
    expect(LOCALE_COOKIE).toBe("rc_locale");
    expect(normalizeLocale(undefined)).toBe("pt");
    expect(normalizeLocale("fr")).toBe("pt");
  });

  it("contains every semantic key in PT, EN and ES without exposing keys", () => {
    for (const key of Object.keys(pt) as Array<keyof typeof pt>) {
      expect(dictionaries.en[key]).toBeTruthy();
      expect(dictionaries.es[key]).toBeTruthy();
      expect(translate("en", key)).not.toBe(key);
      expect(translate("es", key)).not.toBe(key);
    }
  });

  it("keeps complete high-content pages in all supported locales", () => {
    for (const locale of ["pt", "en", "es"] as const) {
      expect(pageContent[locale].plans.items).toHaveLength(4);
      expect(pageContent[locale].about.cards).toHaveLength(3);
      expect(pageContent[locale].contact.questions).toHaveLength(4);
    }
  });

  it("keeps the language selector on Home and reuses BackHomeButton inside the simulator controls", async () => {
    const [nav, simulator, controls] = await Promise.all([
      readFile("components/TopNav.tsx", "utf8"),
      readFile("app/simulador/SimPageClient.tsx", "utf8"),
      readFile("components/TradeControls.tsx", "utf8"),
    ]);
    expect(nav).toContain('onHome ? <><Link href="/login"');
    expect(nav).toContain("<LanguageSelector />");
    expect(nav).toContain(": <BackHomeButton />");
    expect(simulator).toContain('className="chartHeaderActions"');
    expect(simulator).not.toContain("<BackHomeButton />");
    expect(controls).toContain('<span className="tcBack"><BackHomeButton /></span>');
  });
});
