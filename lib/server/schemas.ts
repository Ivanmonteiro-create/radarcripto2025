import { z } from "zod";
import { AUTONOMOUS_TEST_AUTHORIZATION, MAX_TEST_DURATION_MINUTES, MIN_TEST_DURATION_MINUTES } from "@/lib/trading/timedTest";

const botBaseSchema = z.object({
  name: z.string().trim().min(1).max(80),
  symbol: z.string().regex(/^[A-Za-z0-9]{2,15}USDT$/i),
  mode: z.enum(["SIM", "TESTNET"]).default("SIM"),
  strategy: z.enum(["EMA_CROSS", "PERCENT_CYCLE"]).default("EMA_CROSS"),
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
