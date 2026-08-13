"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/LocaleProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" }, body: JSON.stringify({ token }),
    });
    setBusy(false);
    if (!response.ok) return setError(t("login.invalid"));
    router.replace("/robos");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 460, margin: "80px auto", padding: 24 }}>
      <h1>{t("login.title")}</h1><p className="muted">{t("login.description")}</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>{t("login.credential")}
          <input className="inp" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="current-password" required />
        </label>
        <button className="btn" disabled={busy}>{busy ? t("login.validating") : t("login.submit")}</button>
        {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      </form>
    </main>
  );
}
