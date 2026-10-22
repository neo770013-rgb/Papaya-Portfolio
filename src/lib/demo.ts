/** Entirely synthetic, browser-local portfolio dataset. Never calls a server. */
const epoch = Date.now();
const rows = [
  ["BTCUSDT", 0.00082, 68420, 0.08, 840000000, "HOLDING"],
  ["ETHUSDT", 0.00071, 3520, 0.06, 620000000, "HOLDING"],
  ["SOLUSDT", 0.00112, 146, 0.12, 170000000, "OPENABLE"],
  ["AVAXUSDT", 0.00094, 34.8, 0.09, 92000000, "OPENABLE"],
  ["LINKUSDT", 0.00064, 16.2, 0.07, 64000000, "OPENABLE"],
  ["BNBUSDT", 0.00059, 594, 0.10, 130000000, "OPENABLE"],
  ["DOGEUSDT", 0.00088, 0.14, 0.72, 150000000, "FILTERED"],
  ["ADAUSDT", 0.00035, 0.45, 0.12, 48000000, "FILTERED"],
  ["DOTUSDT", 0.00024, 6.3, 0.09, 9000000, "FILTERED"],
  ["ATOMUSDT", 0.00012, 7.5, 0.08, 28000000, "OUTSIDE"],
  ["XRPUSDT", 0.00008, 0.62, 0.06, 85000000, "OUTSIDE"],
  ["LTCUSDT", -0.00016, 81.5, 0.11, 33000000, "FILTERED"],
] as const;

export function demoRates() {
  return rows.map(([symbol, rate, price, basis, volume, gate]) => ({
    symbol, fundingRate: rate, markPrice: price, basis, quoteVolume: volume,
    estNetYield: rate * 9 - 0.0036 - basis / 100,
    apy: rate * 3 * 365 * 100, openInterest: volume / 2,
    nextFunding: Math.max(0, Math.floor((epoch + 7200000 - Date.now()) / 1000)),
    nextFundingTime: epoch + 7200000,
    signal: rate >= 0.0005 ? "ARB" as const : rate >= 0.0001 ? "WATCH" as const : "NONE" as const,
    gate,
  }));
}

function candidates() {
  return demoRates().map((r, index) => {
    const reason = r.gate === "HOLDING" ? "已建立模拟对冲仓位，进入轮换比较池。" : r.gate === "OPENABLE" ? "合成场景满足净收益、基差和流动性门槛。" : r.symbol === "DOGEUSDT" ? "基差超过 0.5% 上限。" : r.symbol === "DOTUSDT" ? "成交额低于 1000 万 USDT。" : r.fundingRate < 0 ? "资金费率为负，不适用现货多 + 合约空。" : "预估收益不足以覆盖成本。";
    return { ...r, rank: index + 1, annualizedPct: r.apy, qty: 2000 / r.markPrice, notional: 2000, priority: 1000 - index * 70,
      hasPosition: r.gate === "HOLDING", openable: r.gate === "OPENABLE", gateStatus: r.gate,
      grossYieldPct: Math.max(0, r.fundingRate * 900), netYieldPct: r.estNetYield * 100,
      feeCostPct: 0.28, slippageCostPct: 0.05, basisRiskPct: r.basis, rotationCostPct: 0.03, entryCostPct: 0.33 + r.basis, allInCostPct: 0.36 + r.basis,
      entryCostCoveragePct: Math.max(0, r.fundingRate * 900 / (0.33 + r.basis) * 100), allInCostCoveragePct: Math.max(0, r.fundingRate * 900 / (0.36 + r.basis) * 100),
      minNetYieldThresholdPct: 0.05, qualityGrade: r.gate === "FILTERED" ? "C" : "A", qualityLabel: "合成场景评级",
      gateReasonCodes: [r.gate], gateReasons: [reason], gateSummary: reason, recommendationReason: reason, entryReasons: [reason],
      entryTimingStatus: "READY_LATER", entryTimingLabel: "观察下一结算窗口", entryTimingDescription: "演示倒计时，不是交易建议。",
    };
  });
}

export function demoStatus() {
  const positions = demoRates().slice(0, 2).map((r, i) => ({
    symbol: r.symbol, spotQty: 2000 / r.markPrice, trackedSpotQty: 2000 / r.markPrice, futuresQty: -2000 / r.markPrice,
    fundingRate: r.fundingRate, nextFundingTime: r.nextFundingTime, unrealizedPnl: i ? -6.8 : 6.8,
    fundingCollected: 0, combinedPnl: i ? -6.8 : 6.8, combinedPnlPct: i ? -0.0034 : 0.0034,
    marginRatio: 0.12, status: "OPEN", recommendation: "HOLD", deltaNeutral: true, deltaGap: 0,
  }));
  return { configured: true, environment: "portfolio-demo", updatedAt: new Date().toISOString(), positions,
    combined: { pnl: 0, fundingCollected: roundMoney(closedSamples().reduce((n,t)=>n+t.attributedFundingPnl,0)), openTradeAttributedFunding: 0, openPositions: 2, totalNotional: 4000, exposureRatio: 0.4 },
    scanScheduler: { baseScanIntervalSeconds: 300, activeScanIntervalSeconds: 300, cadenceReason: "normal-cruise", secondsToFunding: demoRates()[0].nextFunding,
      warningWindowSeconds: 300, urgentWindowSeconds: 120, tooLateWindowSeconds: 45 },
  };
}

export function demoPool() {
  const all = candidates();
  return { configured: true, updatedAt: new Date().toISOString(),
    constraints: { maxConcurrentPositions: 3, maxCapitalPct: 0.2, maxTotalExposurePct: 0.6, perSlotNotional: 2000, maxTotalExposureUsdt: 6000,
      minEntryNetYieldPct: 0.05, maxEntryBasisPct: 0.005, baseScanIntervalSeconds: 300 },
    summary: { occupiedSlots: 2, remainingSlots: 1, totalExposure: 4000, remainingExposure: 2000, perSlotBudget: 2000, spotUsdtFree: 3000, futuresUsdtFree: 3000 },
    candidates: all.filter(r => r.hasPosition || r.openable), filteredCandidates: all.filter(r => r.gate === "FILTERED"),
    filteredReasonStats: [{code:"BASIS", label:"基差过高",count:1},{code:"COST",label:"成本覆盖不足",count:1},{code:"VOLUME",label:"流动性不足",count:1},{code:"NEGATIVE",label:"负费率",count:1}],
    filteredReasonSummary: "基差、流动性、成本和费率方向均参与过滤。", rotation: { status: "WATCHING", currentReason: "观察 SOL 与 AVAX，净优势尚未覆盖轮换成本。", latestReason: "演示：保留当前对冲组合，避免无效换仓。", currentEdge: 218, minEdgeThreshold: 350, minNetAdvantagePct: 0.08 },
  };
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const sampleDailyPnl = [6.4,11.8,-8.6,17.2,9.1,18.4,23.6,-14.2,16.7,22.3,12.8,31.4,-10.6,8.9,28.5,14.2,19.8,-6.4,25.7,32.2,17.1,29.6,-12.8,13.4,24.8,18.6,27.9,-9.2,22.6,24.8];
const sampleScale = 428.6 / sampleDailyPnl.reduce((a,b)=>a+b,0);
const sampleNet = sampleDailyPnl.map(n => roundMoney(n * sampleScale));
sampleNet[29] = roundMoney(428.6 - sampleNet.slice(0,29).reduce((a,b)=>a+b,0));

function closedSamples() {
  const rates = demoRates();
  return sampleNet.map((net, i) => {
    const row = rates[i % 6];
    const funding = roundMoney(2000 * row.fundingRate * 9);
    const fees = roundMoney(2.4 + (i % 4) * 0.4);
    const slippage = roundMoney(0.6 + (i % 3) * 0.2);
    return { id: `synthetic-closed-${i}`, symbol: row.symbol, status: "CLOSED",
      openedAt: new Date(epoch - (32-i)*86400000).toISOString(), closedAt: new Date(epoch - (29-i)*86400000).toISOString(),
      spotQty: 2000 / row.markPrice, futuresQty: -2000 / row.markPrice,
      entryFundingRate: row.fundingRate, entryNotional: 2000, realizedPnl: net, strategyPnl: net,
      attributedFundingPnl: funding, tradingPnl: roundMoney(net - funding + fees + slippage), fees, slippage,
      fundingEventCount: 9, attributionStatus: "CLOSED_FULL", exitReason: net < 0 ? "MANUAL_CLOSE" : "AUTO_TAKE_PROFIT" };
  });
}

export function demoHistory() {
  const closed = closedSamples();
  const open = demoStatus().positions.map((p,i)=>({id:`synthetic-open-${i}`,symbol:p.symbol,status:"OPEN",openedAt:new Date(epoch-3600000).toISOString(),spotQty:p.spotQty,futuresQty:p.futuresQty,entryFundingRate:p.fundingRate,entryNotional:2000,realizedPnl:null,attributedFundingPnl:p.fundingCollected}));
  const funding = roundMoney(closed.reduce((n,t)=>n+t.attributedFundingPnl,0));
  return { summary:{totalTrades:32,openTrades:2,closedTrades:30,realizedPnl:428.6,strategyPnl:428.6,closedAttributedFundingPnl:funding,openAttributedFundingPnl:0,totalAttributedFundingPnl:funding,fullyAttributedClosedTrades:30,winRate:closed.filter(t=>t.realizedPnl>0).length/closed.length*100},trades:[...open,...closed.slice().reverse()] };
}

/** Constructed presentation scenario, not a backtest or account performance. */
export function demoPerformance(days: 7 | 14 | 30 = 30) {
  const all = closedSamples();
  const selected = all.slice(-days);
  const startingCapital = roundMoney(10000 + all.slice(0, all.length - days).reduce((sum,t)=>sum+t.realizedPnl,0));
  let cumulative = 0;
  let peak = startingCapital;
  let maxDrawdownPct = 0;
  const points = [{ label: new Date(Date.parse(selected[0].closedAt)-86400000).toLocaleDateString("zh-CN",{month:"2-digit",day:"2-digit"}), value: 0, daily: 0 }];
  for (const trade of selected) {
    cumulative = roundMoney(cumulative + trade.realizedPnl);
    const equity = startingCapital + cumulative;
    peak = Math.max(peak, equity);
    maxDrawdownPct = Math.max(maxDrawdownPct, (peak-equity)/peak*100);
    points.push({label:new Date(trade.closedAt).toLocaleDateString("zh-CN",{month:"2-digit",day:"2-digit"}),value:cumulative,daily:trade.realizedPnl});
  }
  return { days, points, startingCapital, netPnl:cumulative, netPct:cumulative/startingCapital*100,
    endingCapital:roundMoney(startingCapital+cumulative), maxDrawdownPct,
    winRate:selected.filter(t=>t.realizedPnl>0).length/selected.length*100,
    closedTrades:selected.length, funding:roundMoney(selected.reduce((n,t)=>n+t.attributedFundingPnl,0)),
    trading:roundMoney(selected.reduce((n,t)=>n+t.tradingPnl,0)),fees:roundMoney(selected.reduce((n,t)=>n+t.fees,0)),
    slippage:roundMoney(selected.reduce((n,t)=>n+t.slippage,0)) };
}

export async function demoFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const path = input.split("?")[0];
  let body: unknown;
  if (["/api/agent/status", "/api/agent/status/live", "/api/agent/refresh"].includes(path)) body = demoStatus();
  else if (path === "/api/agent/pool") body = demoPool();
  else if (path === "/api/agent/logs") body = { autoTakeProfit: false, lines: ["[DEMO] 扫描 12 组合成行情；4 个候选通过过滤。", "[DEMO] BTC / ETH 模拟双腿对冲，Delta gap = 0。", "[DEMO] 轮换优势低于门槛，保持当前组合。", "[DEMO] 本站不连接账户、不执行订单。"] };
  else if (path === "/api/agent/history") body = demoHistory();
  else if (path === "/api/agent/scanner-diagnostics") {
    const { symbols = [] } = JSON.parse(String(init.body || "{}"));
    const all = candidates();
    body = {configured:true,updatedAt:new Date().toISOString(),summary:{perSlotBudget:2000,remainingExposure:2000,remainingSlots:1},diagnostics:Object.fromEntries(symbols.map((symbol:string)=>{
      const c=all.find(r=>r.symbol===symbol);return [symbol,{symbol,status:c?.gate || "OUTSIDE",reasonCode:c?.gate || "OUTSIDE",reason:c?.gateSummary || "不在演示候选中",inSpot:true,inFutures:true,hasPosition:c?.hasPosition || false}];
    }))};
  } else return new Response(JSON.stringify({ detail: "作品集演示不提供真实账户操作" }), { status: 403 });
  return new Response(JSON.stringify(body), {status:200,headers:{"Content-Type":"application/json"}});
}
