import { demoFetch as operatorFetch } from "../lib/demo";
const BASE_URL = "/api";

async function fetchJSON<T>(endpoint: string): Promise<T> {
  const res = await operatorFetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface FundingRate {
  symbol: string;
  fundingRate: number;
  estNetYield: number;
  apy: number;
  basis: number;
  nextFunding: number; // seconds until next funding (computed locally)
  nextFundingTime: number; // absolute ms timestamp from exchange
  openInterest: number;
  signal: "ARB" | "WATCH" | "NONE";
}

export interface Stats {
  agentsLive: number;
  fundingCollectedToday: number;
  fundingCollectedChange: number;
  avgNetYield: number;
  avgNetYieldAPY: number;
  activePositions: number;
}

export interface AgentPosition {
  symbol: string;
  spotQty: number;
  trackedSpotQty?: number;
  futuresQty: number;
  fundingRate: number;
  nextFundingTime: number;
  unrealizedPnl: number;
  fundingCollected: number;
  fundingCollectedRawSymbolTotal?: number;
  fundingAttributionStatus?: string;
  fundingEventCount?: number;
  fundingWindowStartAt?: string | null;
  combinedPnl: number;
  combinedPnlPct?: number;
  marginRatio: number;
  status: string;
  recommendation: string;
  deltaNeutral?: boolean;
  deltaGap?: number;
}

export interface AgentStatusErrorDetail {
  code?: string;
  message: string;
  updatedAt?: string | null;
  ageSeconds?: number | null;
  maxAgeSeconds?: number | null;
}

export interface AgentStatus {
  configured: boolean;
  environment: string;
  symbol?: string;
  updatedAt: string;
  spot?: {
    asset: string;
    qty: number;
    usdtFree: number;
    estimatedValue: number;
  };
  futures?: {
    positionAmt: number;
    entryPrice: number;
    markPrice: number;
    unrealizedPnl: number;
    notional: number;
    liquidationPrice: number;
    leverage: number;
    marginRatio: number;
  };
  funding?: {
    rate: number;
    nextFundingTime: number;
    collected: number;
    annualizedPct: number;
  };
  combined?: {
    pnl: number;
    deltaNeutral?: boolean;
    fundingCollected?: number;
    openTradeAttributedFunding?: number;
    openPositions?: number;
    totalNotional?: number;
    exposureRatio?: number;
  };
  scanScheduler?: {
    baseScanIntervalSeconds: number;
    activeScanIntervalSeconds: number;
    cadenceReason: string;
    secondsToFunding?: number | null;
    warningWindowSeconds?: number;
    urgentWindowSeconds?: number;
    tooLateWindowSeconds?: number;
    updatedAt?: string;
  };
  positions: AgentPosition[];
  error?: string;
}

export interface AgentPoolCandidate {
  symbol: string;
  fundingRate: number;
  annualizedPct: number;
  markPrice: number;
  basis: number;
  quoteVolume: number;
  qty: number;
  notional: number;
  priority: number;
  rank: number;
  hasPosition: boolean;
  nextFundingTime?: number;
  secondsToFunding?: number | null;
  entryTimingStatus?: string;
  entryTimingLabel?: string;
  entryTimingDescription?: string;
  grossYieldPct: number;
  netYieldPct: number;
  feeCostPct: number;
  slippageCostPct: number;
  basisRiskPct: number;
  rotationCostPct: number;
  entryCostPct: number;
  allInCostPct: number;
  entryCostCoveragePct: number;
  allInCostCoveragePct: number;
  minNetYieldThresholdPct: number;
  qualityGrade: string;
  qualityLabel: string;
  gateStatus: string;
  openable: boolean;
  gateReasonCodes: string[];
  gateReasons: string[];
  gateSummary: string;
  primaryGateReasonCode?: string | null;
  primaryGateReason?: string | null;
  recommendationReason: string;
  entryReasons: string[];
}

export interface AgentPoolFilterStat {
  code: string;
  label: string;
  count: number;
}

export interface AgentPoolRotationEdge {
  priorityEdge: number;
  fundingEdge: number;
  basisEdge: number;
  netEdge: number;
  fundingRateDeltaPct: number;
  basisDeltaPct: number;
  preRotationNetYieldDeltaPct: number;
  netYieldDeltaPct: number;
  rotationCostPct: number;
  netAdvantageThresholdPct: number;
  requiredNetAdvantagePct: number;
  totalEdge: number;
}

export interface AgentPoolRotation {
  status: string;
  currentReason: string;
  latestReason: string;
  latestActionAt?: string | null;
  currentEdge: number;
  minEdgeThreshold: number;
  minNetAdvantagePct?: number;
  minEntryNetYieldPct?: number;
  incomingSymbol?: string | null;
  outgoingSymbol?: string | null;
  incoming?: AgentPoolCandidate | null;
  outgoing?: AgentPoolCandidate | null;
  edge?: AgentPoolRotationEdge | null;
}

export interface ScannerDiagnostic {
  symbol: string;
  status: "OUTSIDE" | "FILTERED" | "OPENABLE" | "HOLDING";
  reasonCode: string;
  reason: string;
  inSpot: boolean;
  inFutures: boolean;
  hasPosition: boolean;
  budgetForSymbol?: number;
  qty?: number;
  minQty?: number;
  gateReasonCodes?: string[];
}

export interface ScannerDiagnosticsResponse {
  configured: boolean;
  updatedAt: string;
  summary: {
    perSlotBudget: number;
    remainingExposure: number;
    remainingSlots?: number;
  };
  diagnostics: Record<string, ScannerDiagnostic>;
  error?: string;
}

export interface AgentPoolState {
  configured: boolean;
  updatedAt: string;
  constraints: {
    maxConcurrentPositions: number;
    maxCapitalPct: number;
    maxTotalExposurePct: number;
    perSlotNotional: number;
    maxTotalExposureUsdt: number;
    minEntryNetYieldPct: number;
    maxEntryBasisPct: number;
    baseScanIntervalSeconds?: number;
    settlementWarningSeconds?: number;
    settlementUrgentSeconds?: number;
    settlementTooLateSeconds?: number;
  };
  summary: {
    occupiedSlots: number;
    remainingSlots: number;
    totalExposure: number;
    remainingExposure: number;
    perSlotBudget: number;
    spotUsdtFree?: number;
    futuresUsdtFree?: number;
  };
  candidates: AgentPoolCandidate[];
  filteredCandidates: AgentPoolCandidate[];
  filteredReasonStats: AgentPoolFilterStat[];
  filteredReasonSummary: string;
  rotation: AgentPoolRotation;
  error?: string;
}

export interface AgentLogs {
  lines: string[];
  autoTakeProfit?: boolean;
}

export interface TradeHistoryItem {
  id: string;
  symbol: string;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  spotQty: number;
  futuresQty: number;
  entryFundingRate?: number;
  entryNotional?: number;
  realizedPnl?: number | null;
  legacyRealizedPnl?: number | null;
  strategyPnl?: number | null;
  spotLegPnl?: number | null;
  futuresLegPnl?: number | null;
  attributedFundingPnl?: number | null;
  attributionStatus?: string;
  fundingEventCount?: number;
  fundingWindowStartAt?: string | null;
  fundingWindowEndAt?: string | null;
  backfilled?: boolean;
  exitReason?: string | null;
}

export interface TradeHistoryResponse {
  summary: {
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    realizedPnl: number;
    strategyPnl?: number;
    closedAttributedFundingPnl?: number;
    openAttributedFundingPnl?: number;
    totalAttributedFundingPnl?: number;
    fullyAttributedClosedTrades?: number;
    winRate: number;
  };
  trades: TradeHistoryItem[];
}

export interface YieldDataPoint {
  date: string;
  yield: number;
}

export interface AgentActivity {
  time: string;
  heartbeats: number;
}

export const api = {
  getFundingRates: () => fetchJSON<FundingRate[]>("/funding-rates"),
  getStats: () => fetchJSON<Stats>("/stats"),
  getYieldHistory: () => fetchJSON<YieldDataPoint[]>("/yield-history"),
  getAgentActivity: () => fetchJSON<AgentActivity[]>("/agent-activity"),
  getAgentStatus: () => fetchJSON<AgentStatus>("/agent/status"),
  getAgentLogs: () => fetchJSON<AgentLogs>("/agent/logs"),
  getTradeHistory: () => fetchJSON<TradeHistoryResponse>("/agent/history"),
  getAgentPool: () => fetchJSON<AgentPoolState>("/agent/pool"),
  getScannerDiagnostics: async (symbols: string[]) => {
    const res = await operatorFetch(`${BASE_URL}/agent/scanner-diagnostics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols }),
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<ScannerDiagnosticsResponse>;
  },
};
