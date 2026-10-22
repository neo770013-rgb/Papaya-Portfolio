import PerformancePanel from "../components/PerformancePanel";
import { useEffect, useMemo, useState, useCallback } from "react";
import { api, type AgentStatus, type TradeHistoryResponse, type TradeHistoryItem } from "../lib/api";

const EXIT_REASON_LABELS: Record<string, string> = {
  MANUAL_CLOSE: "手动平仓",
  AUTO_TAKE_PROFIT: "自动止盈",
  STOP_LOSS_CLOSE: "止损平仓",
  EMERGENCY_CLOSE: "紧急平仓",
  CONSIDER_EXIT: "条件退出",
};

const EMPTY_HISTORY: TradeHistoryResponse = {
  summary: { totalTrades: 0, openTrades: 0, closedTrades: 0, realizedPnl: 0, winRate: 0 },
  trades: [],
};

export default function TradeHistory() {
  const [visibleCount,setVisibleCount] = useState(8);
  const [data, setData] = useState<TradeHistoryResponse | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [wsStatus, setWsStatus] = useState<"CONNECTING" | "CONNECTED" | "DISCONNECTED">("CONNECTING");
  const [lastPushAt, setLastPushAt] = useState<string>("");

  const fetchHistory = useCallback(async () => {
    try {
      const [history, status] = await Promise.all([
        api.getTradeHistory(),
        api.getAgentStatus().catch(() => null),
      ]);
      setData(history);
      setAgentStatus(status);
      setLastUpdated(new Date().toLocaleString());
    } catch {
      setData(EMPTY_HISTORY);
      setAgentStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    setWsStatus("CONNECTED");
    const id = setInterval(() => { fetchHistory(); setLastPushAt(new Date().toLocaleTimeString()); }, 10000);
    return () => clearInterval(id);
  }, [fetchHistory]);

  const filteredTrades = useMemo(() => {
    const trades = data?.trades ?? [];
    return trades.filter((trade) => {
      const matchesStatus = statusFilter === "ALL" || trade.status === statusFilter;
      const matchesSymbol = !symbolFilter || trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
      return matchesStatus && matchesSymbol;
    });
  }, [data, statusFilter, symbolFilter]);

  const closedTradesWithPnl = useMemo(() => {
    const trades = data?.trades ?? [];
    return trades.filter((trade) => trade.status === "CLOSED" && trade.realizedPnl != null).length;
  }, [data]);

  const fundingCollected = agentStatus?.combined?.fundingCollected ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold uppercase tracking-tighter leading-[0.9]" style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}>
          交易记录
        </h1>
        <p className="text-muted-foreground text-lg mt-2">合成交易样本，用于展示状态流转、筛选与收益归因；不代表真实交易。</p>
      </div>

      <PerformancePanel compact />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border">
        <StatCard label="总交易数" value={String(data?.summary.totalTrades ?? 0)} />
        <StatCard label="进行中" value={String(data?.summary.openTrades ?? 0)} />
        <StatCard label="已平仓" value={String(data?.summary.closedTrades ?? 0)} />
        <StatCard label="已收资金费" value={formatMetric(fundingCollected)} accent />
        <StatCard label="平仓策略 P&L" value={(data?.summary.realizedPnl ?? 0).toFixed(4)} accent />
      </div>

      <div className="border-2 border-border p-4 md:p-5 text-sm text-muted-foreground space-y-2">
        <p>已收资金费：当前合成样本累计 funding fee，不等于某一笔单独交易的最终收益。</p>
        <p>平仓策略 P&amp;L：记录平仓时的策略综合收益口径，不是“纯资金费收益”；历史回填的平仓单可能暂时没有该数值。</p>
        <p>当前已平仓记录中，已有策略 P&amp;L 数值的笔数：{closedTradesWithPnl} / {data?.summary.closedTrades ?? 0}</p>
      </div>

      <div className="border-2 border-border p-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-widest">最后更新时间：{lastUpdated || "--"}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-3 flex-wrap">
            <span>数据模式：{wsStatus === "CONNECTED" ? "本地演示中" : wsStatus === "CONNECTING" ? "演示初始化" : "演示已停止"}</span>
            <span>最后推送时间：{lastPushAt || "--"}</span>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            ["ALL", "全部"],
            ["OPEN", "进行中"],
            ["CLOSED", "已平仓"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`h-10 px-4 text-xs font-bold uppercase tracking-widest border-2 ${statusFilter === value ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={symbolFilter}
          onChange={(e) => setSymbolFilter(e.target.value)}
          placeholder="搜索币对，如 BTC / SOL"
          className="bg-transparent border-2 border-border text-foreground text-sm h-10 px-4 w-full md:w-72 outline-none font-sans"
        />
      </div>

      <div className="space-y-4">
        {filteredTrades.length ? filteredTrades.slice(0,visibleCount).map((trade) => <TradeCard key={trade.id} trade={trade} />) : (
          <div className="border-2 border-border p-8 text-muted-foreground">暂无符合条件的交易记录。</div>
        )}
      </div>
      {filteredTrades.length > visibleCount && <button className="history-more" onClick={()=>setVisibleCount(n=>n+8)}>查看更多样本（剩余 {filteredTrades.length-visibleCount} 笔） ↓</button>}
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-background p-5">
      <p className={`font-mono text-2xl font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function TradeCard({ trade }: { trade: TradeHistoryItem }) {
  const isOpen = trade.status === "OPEN";
  const hasRealizedPnl = trade.realizedPnl != null;

  return (
    <div className="border-2 border-border p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-mono text-2xl font-bold">{trade.symbol}</h2>
            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 border-2 ${isOpen ? "border-accent text-accent" : "border-border text-muted-foreground"}`}>
              {isOpen ? "OPEN · 进行中" : "CLOSED · 已平仓"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">开仓时间：{new Date(trade.openedAt).toLocaleString()}</p>
          {trade.closedAt && <p className="text-sm text-muted-foreground">平仓时间：{new Date(trade.closedAt).toLocaleString()}</p>}
        </div>
        <div className="text-right md:max-w-sm">
          <p className={`font-mono text-2xl font-bold ${isOpen || (trade.realizedPnl ?? 0) >= 0 ? "text-green" : "text-red"}`}>
            {formatMetric(trade.realizedPnl)}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            {isOpen ? "P&L PENDING / 待平仓" : "CLOSED STRATEGY P&L / 平仓策略收益"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {isOpen
              ? "未平仓时不显示已实现收益。"
              : hasRealizedPnl
                ? "该值表示平仓时记录的策略综合收益口径，非纯资金费。"
                : "这笔平仓记录来自历史回填，当前尚未补算策略收益。"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 text-sm">
        <Info label="现货数量" value={trade.spotQty.toFixed(4)} />
        <Info label="期货数量" value={trade.futuresQty.toFixed(4)} />
        <Info label="入场资金费率" value={`${((trade.entryFundingRate ?? 0) * 100).toFixed(4)}%`} />
        <Info label="开仓名义价值" value={`$${(trade.entryNotional ?? 0).toFixed(4)}`} />
        <Info label="收益口径" value={isOpen ? "待平仓" : hasRealizedPnl ? "策略综合" : "历史回填"} />
      </div>

      <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
        平仓原因：{EXIT_REASON_LABELS[trade.exitReason ?? ""] ?? trade.exitReason ?? "--"}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-mono text-base font-bold mt-2">{value}</p>
    </div>
  );
}

function formatMetric(value: number | null | undefined): string {
  return value == null ? "--" : value.toFixed(4);
}
