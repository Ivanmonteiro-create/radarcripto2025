import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n/config";
import { dictionaries, pt, translate } from "@/lib/i18n/dictionaries";
import { pageContent } from "@/lib/i18n/pageContent";

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
});
