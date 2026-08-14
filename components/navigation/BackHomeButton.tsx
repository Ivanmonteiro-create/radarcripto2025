"use client";
import Link from "next/link";
import { useI18n } from "@/components/i18n/LocaleProvider";
export default function BackHomeButton() { const { t } = useI18n(); return <Link href="/" className="rc-back-home"><span aria-hidden>←</span><span>{t("actions.backHome")}</span></Link>; }
