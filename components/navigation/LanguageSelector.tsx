"use client";
import { useState } from "react";
import { type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n/LocaleProvider";
export default function LanguageSelector() {
  const { locale, setLocale, t } = useI18n(); const [open, setOpen] = useState(false);
  return <div className="rc-language"><button type="button" className="rc-language__trigger" aria-label={t("language.label")} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>🌐 <span>{locale.toUpperCase()}</span></button>{open && <div className="rc-language__menu" role="menu">{(["pt", "en", "es"] as Locale[]).map((item) => <button key={item} type="button" role="menuitemradio" aria-checked={locale === item} onClick={() => { setOpen(false); void setLocale(item); }}>{t(`language.${item}`)}</button>)}</div>}</div>;
}
