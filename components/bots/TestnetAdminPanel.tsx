"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/LocaleProvider";

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
  const { locale, t } = useI18n();
  const l = (pt: string, en: string, es: string) => locale === "en" ? en : locale === "es" ? es : pt;
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
    setMessage(response.ok ? l("Operação Testnet concluída.", "Testnet operation completed.", "Operación Testnet completada.") : l("Operação recusada; consulte o health e os logs sanitizados.", "Operation rejected; check health and sanitized logs.", "Operación rechazada; consulta el health y los logs sanitizados."));
    await load();
  }

  return (
    <section className="panel" style={{ padding: 14, display: "grid", gap: 12 }}>
      <div><strong>{t("bots.environment")}</strong><div className="muted">{l("Health protegido e credenciais Binance Spot Testnet criptografadas.", "Protected health and encrypted Binance Spot Testnet credentials.", "Health protegido y credenciales cifradas de Binance Spot Testnet.")}</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        <Health label={l("Aplicação", "Application", "Aplicación")} item={health?.application} empty={t("common.notProvided")} />
        <Health label="PostgreSQL" item={health?.database} empty={t("common.notProvided")} />
        <Health label="Worker" item={health?.worker} empty={t("common.notProvided")} />
        <Health label="Binance Testnet" item={health?.binance} empty={t("common.notProvided")} />
      </div>
      <div className="muted">
        {l("Credencial", "Credential", "Credencial")}: {credentials?.configured ? credentials.apiKeyMask : l("não cadastrada", "not registered", "no registrada")} · {credentials?.enabled ? l("validada", "validated", "validada") : l("desabilitada", "disabled", "deshabilitada")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input aria-label="Binance Testnet API Key" autoComplete="off" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Testnet API Key" />
        <input aria-label="Binance Testnet API Secret" autoComplete="new-password" type="password" value={apiSecret} onChange={(event) => setApiSecret(event.target.value)} placeholder="Testnet API Secret" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" disabled={busy || !apiKey || !apiSecret} onClick={() => void mutate("PUT", { apiKey, apiSecret, symbol })}>{l("Salvar, criptografar e validar", "Save, encrypt and validate", "Guardar, cifrar y validar")}</button>
        <button className="btn" disabled={busy || !credentials?.configured} onClick={() => void mutate("POST", { symbol })}>{l("Revalidar somente leitura", "Revalidate read only", "Revalidar solo lectura")}</button>
        <button className="btn btnSell" disabled={busy || !credentials?.configured} onClick={() => window.confirm(l("Apagar as credenciais Testnet e pausar bots associados?", "Delete Testnet credentials and pause associated bots?", "¿Borrar las credenciales Testnet y pausar los robots asociados?")) && void mutate("DELETE")}>{l("Apagar credenciais", "Delete credentials", "Borrar credenciales")}</button>
      </div>
      {credentials?.lastValidationError && <div className="pnlNeg">Última validação falhou (detalhe sanitizado no servidor).</div>}
      {message && <div className="muted">{message}</div>}
      <small className="muted">A primeira ordem não é enviada por esta tela; ela exige a rota manual e a frase de autorização explícita documentada.</small>
    </section>
  );
}

function Health({ label, item, empty }: { label: string; item?: HealthItem; empty: string }) {
  return <div><small className="muted">{label}</small><div className="bold">{item?.state ?? "—"}</div><small className="muted">{item?.message ?? empty}</small></div>;
}
