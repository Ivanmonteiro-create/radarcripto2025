import { z } from "zod";
import { AUTONOMOUS_TEST_AUTHORIZATION, MAX_TEST_DURATION_MINUTES, MIN_TEST_DURATION_MINUTES } from "@/lib/trading/timedTest";

const botBaseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  symbol: z.string().regex(/^[A-Za-z0-9]{2,15}USDT$/i),
  mode: z.enum(["SIM", "TESTNET"]).default("SIM"),
  strategy: z.enum(["EMA_CROSS", "PERCENT_CYCLE", "RANGE_CYCLE"]).default("EMA_CROSS"),
  strategyParams: z.record(z.union([z.number(), z.string(), z.boolean(), z.null()])),
  capitalUSDT: z.number().positive().max(10_000_000),
  maxCapitalUSDT: z.number().positive().max(10_000_000),
  maxOrderUSDT: z.number().positive().max(1_000_000),
  maxPositions: z.number().int().min(1).max(20).default(1),
  maxDailyLossUSDT: z.number().positive(),
  maxDrawdownPct: z.number().positive().max(100),
  minOrderIntervalMs: z.number().int().min(1000).max(86_400_000),
  takeProfitPct: z.number().positive().max(100).optional(),
  stopLossPct: z.number().positive().max(100).optional(),
}).strict();

export const botCreateSchema = botBaseSchema
  .refine((value) => value.capitalUSDT <= value.maxCapitalUSDT, {
    message: "capitalUSDT cannot exceed maxCapitalUSDT",
  })
  .superRefine((value, context) => {
    if (value.strategy === "EMA_CROSS") {
      const short = Number(value.strategyParams.shortPeriod);
      const long = Number(value.strategyParams.longPeriod);
      if (!Number.isInteger(short) || !Number.isInteger(long) || short < 2 || long <= short) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams"], message: "EMA requires integer periods with 2 <= shortPeriod < longPeriod" });
      }
      const fixedOrderUSDT = value.strategyParams.fixedOrderUSDT;
      if (fixedOrderUSDT !== undefined && (!(Number(fixedOrderUSDT) > 0) || Number(fixedOrderUSDT) > value.maxOrderUSDT || Number(fixedOrderUSDT) > value.capitalUSDT)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams", "fixedOrderUSDT"], message: "EMA fixedOrderUSDT must be positive and within capital and order limits" });
      }
      if (value.mode === "TESTNET" && fixedOrderUSDT === undefined) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams", "fixedOrderUSDT"], message: "TESTNET EMA requires explicit fixedOrderUSDT" });
      }
      const samplingIntervalMs = value.strategyParams.samplingIntervalMs;
      if (samplingIntervalMs !== undefined && (!Number.isInteger(Number(samplingIntervalMs)) || Number(samplingIntervalMs) < 1_000)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams", "samplingIntervalMs"], message: "EMA samplingIntervalMs must be an integer of at least 1000" });
      }
      if (value.strategyParams.variant === "A2") {
        const minExpectedEdgeBps = Number(value.strategyParams.minExpectedEdgeBps);
        const minEmaSeparationBps = Number(value.strategyParams.minEmaSeparationBps);
        const minRollingRangeBps = Number(value.strategyParams.minRollingRangeBps);
        const rollingRangeWindow = Number(value.strategyParams.rollingRangeWindow);
        if (![minExpectedEdgeBps, minEmaSeparationBps, minRollingRangeBps].every((threshold) => Number.isFinite(threshold) && threshold >= 0)) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams"], message: "EMA A2 thresholds must be explicit non-negative numbers" });
        }
        if (!Number.isInteger(rollingRangeWindow) || rollingRangeWindow < long) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams", "rollingRangeWindow"], message: "EMA A2 rollingRangeWindow must be an integer at least as large as longPeriod" });
        }
      }
      if (value.strategyParams.variant === "A2.1") {
        const thresholds = [
          Number(value.strategyParams.minExpectedEdgeBps),
          Number(value.strategyParams.minEmaSeparationBps),
          Number(value.strategyParams.minRange5mBps),
          Number(value.strategyParams.minRange15mBps),
        ];
        if (!thresholds.every((threshold) => Number.isFinite(threshold) && threshold >= 0)) {
          context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams"], message: "EMA A2.1 thresholds must be explicit non-negative numbers" });
        }
      }
    }
    if (value.strategy === "PERCENT_CYCLE") {
      const sell = Number(value.strategyParams.sellRisePct);
      const rebuy = Number(value.strategyParams.rebuyDropPct);
      if (!(sell > 0) || !(rebuy > 0)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["strategyParams"], message: "PERCENT_CYCLE requires positive sellRisePct and rebuyDropPct" });
      }
    }
  });

export const botPatchSchema = botBaseSchema.partial().strict();
export const botActionSchema = z.object({ confirmation: z.literal(true) }).strict();
export const botTestStartSchema = z.object({
  durationMinutes: z.number().int().min(MIN_TEST_DURATION_MINUTES).max(MAX_TEST_DURATION_MINUTES),
  authorization: z.literal(AUTONOMOUS_TEST_AUTHORIZATION),
}).strict();
export const botTestStopSchema = z.object({ confirmation: z.literal(true) }).strict();
export const killSwitchSchema = z.object({ active: z.boolean(), reason: z.string().trim().min(3).max(240) }).strict();

const rangeLevelSchema = z.object({
  levelNumber: z.number().int().min(1).max(10), entryPrice: z.number().positive(), targetPrice: z.number().positive(),
  quoteAmount: z.number().positive(), enabled: z.boolean(), repeat: z.boolean(),
}).strict();

export const rangeStrategyConfigSchema = z.object({
  mode: z.enum(["READY", "CUSTOM"]), name: z.string().trim().min(1).max(80),
  symbol: z.string().regex(/^[A-Za-z0-9]{3,20}$/).transform((value) => value.toUpperCase()),
  capitalTotal: z.number().positive().max(10_000_000), maxCommitted: z.number().positive().max(10_000_000),
  maxExposure: z.number().positive().max(10_000_000), structuralStop: z.number().positive(),
  simulatedMakerFeeBps: z.number().min(0).max(1_000),
  simulatedSlippageBps: z.number().min(0).max(1_000), costWarningAccepted: z.boolean(),
  levels: z.array(rangeLevelSchema).min(1).max(10),
}).strict();

export const rangeStrategyStartSchema = z.object({
  authorization: z.literal("I_AUTHORIZE_BINANCE_SPOT_TESTNET_STRATEGY_B_START"),
  configurationId: z.string().cuid(),
}).strict();
