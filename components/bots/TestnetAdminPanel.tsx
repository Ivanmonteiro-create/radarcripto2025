"use client";

import { useCallback, useEffect, useState } from "react";

type State = "HEALTHY" | "DEGRADED" | "UNHEALTHY";
type HealthItem = { state: State; message: string; details?: Record<string, unknown> };
type HealthPayload = {
  overall: State;
  application: HealthItem;
  database: HealthItem;
  worker: HealthItem;
  binance: HealthItem;
};
type CredentialSummary = {
  configured: boolean;
  enabled: boolean;
  apiKeyMask?: string;
  lastValidatedAt?: string;
  lastValidationError?: string;
};

export default function TestnetAdminPanel({ symbol }: { symbol: string }) {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [credentials, setCredentials] = useState<CredentialSummary | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [healthResponse, credentialResponse] = await Promise.all([
      fetch(`/api/health?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" }),
      fetch("/api/exchange-credentials", { cache: "no-store" }),
    ]);
    if (healthResponse.ok) setHealth(((await healthResponse.json()) as { health: HealthPayload }).health);
    if (credentialResponse.ok) setCredentials(((await credentialResponse.json()) as { credentials: CredentialSummary }).credentials);
  }, [symbol]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function mutate(method: "PUT" | "POST" | "DELETE", body?: Record<string, unknown>) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/exchange-credentials", {
      method,
      headers: { "content-type": "application/json", "x-radarcrypto-csrf": "1" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    setApiKey(""); setApiSecret("");
    setMessage(response.ok ? "Operação Testnet concluída." : "Operação recusada; consulte o health e os logs sanitizados.");
    await load();
  }

  return (
    <section className="panel" style={{ padding: 14, display: "grid", gap: 12 }}>
      <div><strong>Ambiente integrado</strong><div className="muted">Health protegido e credenciais Binance Spot Testnet criptografadas.</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        <Health label="Aplicação" item={health?.application} />
        <Health label="PostgreSQL" item={health?.database} />
        <Health label="Worker" item={health?.worker} />
        <Health label="Binance Testnet" item={health?.binance} />
      </div>
      <div className="muted">
        Credencial: {credentials?.configured ? credentials.apiKeyMask : "não cadastrada"} · {credentials?.enabled ? "validada" : "desabilitada"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input aria-label="Binance Testnet API Key" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Testnet API Key" />
        <input aria-label="Binance Testnet API Secret" autoComplete="new-password" type="password" value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder="Testnet API Secret" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy || !apiKey || !apiSecret} onClick={() => void mutate("PUT", { apiKey, apiSecret, symbol })}>Salvar, criptografar e validar</button>
        <button className="btn" disabled={busy || !credentials?.configured} onClick={() => void mutate("POST", { symbol })}>Revalidar somente leitura</button>
        <button className="btn btnSell" disabled={busy || !credentials?.configured} onClick={() => window.confirm("Apagar as credenciais Testnet e pausar bots associados?") && void mutate("DELETE")}>Apagar credenciais</button>
      </div>
      {credentials?.lastValidationError && <div className="pnlNeg">Última validação falhou (detalhe sanitizado no servidor).</div>}
      {message && <div className="muted">{message}</div>}
      <small className="muted">A primeira ordem não é enviada por esta tela; ela exige a rota manual e a frase de autorização explícita documentada.</small>
    </section>
  );
}

function Health({ label, item }: { label: string; item?: HealthItem }) {
  return <div><small className="muted">{label}</small><div className="bold">{item?.state ?? "—"}</div><small className="muted">{item?.message ?? "Não consultado"}</small></div>;
}
