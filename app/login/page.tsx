"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }),
    });
    setBusy(false);
    if (!response.ok) return setError("Credencial interna inválida.");
    router.replace("/robos");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 460, margin: "80px auto", padding: 24 }}>
      <h1>Acesso interno</h1>
      <p className="muted">A fundação de trading está em fase experimental. Use apenas a credencial interna do servidor.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>Credencial
          <input className="inp" type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="current-password" required />
        </label>
        <button className="btn" disabled={busy}>{busy ? "Validando…" : "Entrar"}</button>
        {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      </form>
    </main>
  );
}
