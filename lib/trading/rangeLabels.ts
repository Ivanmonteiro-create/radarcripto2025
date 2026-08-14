export type RadarLocale = "pt" | "en" | "es";

const labels: Record<RadarLocale, Record<string, string>> = {
  pt: {
    WAITING_BUY: "Aguardando preço de compra", BUY_PENDING: "Ordem de compra pendente",
    WAITING_SELL: "Aguardando preço de venda", SELL_PENDING: "Ordem de venda pendente",
    COMPLETED: "Concluído", STOPPED: "Parado", ERROR: "Erro", ACTIVE: "Ativo",
    VALIDATED: "Validado", DRAFT: "Rascunho", ARCHIVED: "Arquivado", READY: "Pronto", CUSTOM: "Personalizado",
    HOLDING: "Posição aberta", TARGET: "Alvo", STOP: "Stop", MANUAL: "Manual", RISK: "Risco", OTHER: "Outro",
  },
  en: {
    WAITING_BUY: "Waiting for buy price", BUY_PENDING: "Buy order pending",
    WAITING_SELL: "Waiting for sell price", SELL_PENDING: "Sell order pending",
    COMPLETED: "Completed", STOPPED: "Stopped", ERROR: "Error", ACTIVE: "Active",
    VALIDATED: "Validated", DRAFT: "Draft", ARCHIVED: "Archived", READY: "Ready", CUSTOM: "Custom",
    HOLDING: "Open position", TARGET: "Target", STOP: "Stop", MANUAL: "Manual", RISK: "Risk", OTHER: "Other",
  },
  es: {
    WAITING_BUY: "Esperando precio de compra", BUY_PENDING: "Orden de compra pendiente",
    WAITING_SELL: "Esperando precio de venta", SELL_PENDING: "Orden de venta pendiente",
    COMPLETED: "Completado", STOPPED: "Detenido", ERROR: "Error", ACTIVE: "Activo",
    VALIDATED: "Validado", DRAFT: "Borrador", ARCHIVED: "Archivado", READY: "Listo", CUSTOM: "Personalizado",
    HOLDING: "Posición abierta", TARGET: "Objetivo", STOP: "Stop", MANUAL: "Manual", RISK: "Riesgo", OTHER: "Otro",
  },
};

export function rangeLabel(value: string, locale: RadarLocale) {
  return labels[locale][value] ?? value;
}
