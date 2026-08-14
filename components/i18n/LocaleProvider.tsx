"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, type Locale, localeTag } from "@/lib/i18n/config";
import { translate, type TranslationKey } from "@/lib/i18n/dictionaries";

type LocaleContextValue = { locale: Locale; localeTag: string; t: (key: TranslationKey) => string; setLocale: (locale: Locale) => Promise<void> };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, updateLocale] = useState(initialLocale);
  const setLocale = useCallback(async (next: Locale) => {
    updateLocale(next);
    document.documentElement.lang = localeTag[next];
    await fetch("/api/locale", { method: "PUT", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ locale: next }) });
    router.refresh();
  }, [router]);
  const value = useMemo(() => ({ locale, localeTag: localeTag[locale], t: (key: TranslationKey) => translate(locale, key), setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  return useContext(LocaleContext) ?? { locale: DEFAULT_LOCALE, localeTag: localeTag[DEFAULT_LOCALE], t: (key: TranslationKey) => translate(DEFAULT_LOCALE, key), setLocale: async () => undefined };
}
