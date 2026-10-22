import { demoFetch as operatorFetch } from "../lib/demo";
import { useEffect, useMemo, useState } from "react";

function fmtPct(v: number, digits = 2) {
  return `${v.toFixed(digits)}%`;
}

const parameterGuides = [
  {
    name: "单仓上限",
    meaning: "限制单个标的最多能占用多少资金，防止一个币把整个系统拖下水。",
    higher: "调大后更敢重仓高费率标的，收益可能更高，但单币风险也更集中。",
    lower: "调小后更稳，更分散，但高质量机会吃不满。",
  },
  {
    name: "总敞口上限",
    meaning: "限制整套系统最多同时拿多少仓位，决定整体进攻性。",
    higher: "调大后整体资金利用率更高，但同一时间暴露的风险也更高。",
    lower: "调小后更保守，回撤通常更小，但赚钱速度会变慢。",
  },
  {
    name: "最小净优势阈值",
    meaning: "轮换时要求新候选至少比旧仓多赚多少净收益，才允许换仓。",
    higher: "调高后不容易频繁换仓，能减少手续费和滑点磨损。",
    lower: "调低后更积极追逐新机会，但容易过度轮换。",
  },
  {
    name: "轮换 Edge 阈值",
    meaning: "轮换执行器的综合门槛，除了净收益，还会把 funding、basis、优先级一起算进去。",
    higher: "调高后只有明显更优的候选才会触发轮换。",
    lower: "调低后更容易换仓，更像激进模式。",
  },
  {
    name: "自动止盈",
    meaning: "达到止盈条件后，系统是否自动平仓，而不是只给建议。",
    higher: "开启后更自动化，能锁定收益，但也可能卖飞后续 funding。",
    lower: "关闭后更保守，适合你想人工确认每次退出。",
  },
];

export default function Strategy() {
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [agentPool, setAgentPool] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const [statusRes, poolRes, logsRes] = await Promise.allSettled([
        operatorFetch("/api/agent/status").then((r) => r.json()),
        operatorFetch("/api/agent/pool").then((r) => r.json()),
        operatorFetch("/api/agent/logs").then((r) => r.json()),
      ]);
      if (statusRes.status === "fulfilled") setAgentStatus(statusRes.value);
      if (poolRes.status === "fulfilled") setAgentPool(poolRes.value);
      if (logsRes.status === "fulfilled") setAgentLogs(logsRes.value);
    };
    load();
  }, []);

  const runtimeSections = useMemo(() => {
    const maxConcurrent = agentPool?.constraints?.maxConcurrentPositions ?? 3;
    const maxCapitalPct = (agentPool?.constraints?.maxCapitalPct ?? 0.2) * 100;
    const maxTotalExposurePct = (agentPool?.constraints?.maxTotalExposurePct ?? 0.6) * 100;
    const rotation = agentPool?.rotation;
    return [
      {
        title: "当前运行模式（演示）",
        items: [
          ["运行环境", agentStatus?.environment === "testnet" ? "Binance 测试网" : (agentStatus?.environment ?? "--")],
          ["策略模式", "资金费率套利 + 三仓机枪池 + 自动轮换"],
          ["当前在线状态", agentStatus?.configured ? "合成数据已加载" : "未配置 / 未连接"],
          ["当前打开仓位", `${agentStatus?.combined?.openPositions ?? 0} / ${maxConcurrent}`],
          ["自动止盈", agentLogs?.autoTakeProfit ? "已开启" : "未开启"],
          ["轮换执行器", rotation?.status ? `已启用（当前状态：${rotation.status}）` : "已启用"],
        ],
      },
      {
        title: "策略参数快照（演示）",
        items: [
          ["单仓上限", `${maxCapitalPct.toFixed(0)}%`],
          ["总敞口上限", `${maxTotalExposurePct.toFixed(0)}%`],
          ["并发仓位上限", `${maxConcurrent} 仓`],
          ["当前总敞口", `$${(agentPool?.summary?.totalExposure ?? 0).toFixed(2)}`],
          ["当前剩余敞口", `$${(agentPool?.summary?.remainingExposure ?? 0).toFixed(2)}`],
          ["当前单仓预算", `$${(agentPool?.summary?.perSlotBudget ?? 0).toFixed(2)}`],
        ],
      },
      {
        title: "开仓逻辑（设计逻辑）",
        items: [
          ["入场资金费率阈值", "> 0.05% / 8H"],
          ["基差要求", "< 0.5%"],
          ["流动性要求", "24H 成交额 > 1000 万 USDT"],
          ["执行方式", "现货买入 + 永续做空，保持 Delta 中性"],
          ["当前候选池排序", "净收益优先（毛收益 - 手续费 - 滑点 - basis 折价 - 轮换成本）"],
          ["当前候选数", `${agentPool?.candidates?.length ?? 0}`],
        ],
      },
      {
        title: "退出与轮换逻辑（设计逻辑）",
        items: [
          ["止损", "未实现亏损 <= -1.5% 时退出"],
          ["低费率退出", "funding rate < 0.01% 时考虑退出"],
          ["紧急平仓", "保证金压力过高时立即退出"],
          ["轮换判断", rotation?.currentReason ?? "当前无轮换说明"],
          ["轮换 edge 阈值", `${(rotation?.minEdgeThreshold ?? 0).toFixed(2)}`],
          ["最小净优势阈值", fmtPct(rotation?.minNetAdvantagePct ?? 0, 4)],
        ],
      },
    ];
  }, [agentStatus, agentPool, agentLogs]);

  const algorithmCards = [
    {
      title: "候选池评分（机枪池 v2）",
      description:
        "系统不再只看 funding 高不高，而是同时看毛收益、净收益、基差、流动性和成本。真正排序靠的是净收益优先。",
      formula: "priority ≈ 净收益 + funding 强度 + 流动性 - basis 风险",
    },
    {
      title: "净收益模型（设计逻辑）",
      description:
        "每个候选先扣手续费、滑点、basis 风险折价、轮换成本，再得到净收益。只有净收益更高，候选才更靠前。",
      formula: "净收益 = 毛收益 - 手续费 - 滑点 - basis 折价 - 轮换成本",
    },
    {
      title: "轮换执行器（设计逻辑）",
      description:
        "只有当新候选的净优势足够明显，且超过轮换成本与最小优势阈值时，系统才会踢掉当前最弱仓位并换入更优标的。",
      formula: "净优势 > 轮换成本 + 最小净优势阈值，并且 edge > 最小轮换 edge",
    },
  ];

  const humanExplanations = [
    {
      label: "这个系统靠什么赚钱？",
      value:
        "靠多头和空头之间的资金费率差。现货买入、合约做空后，价格涨跌影响会大致互相抵消，剩下的主要收益来源就是资金费。",
    },
    {
      label: "为什么还要做机枪池？",
      value:
        "因为高费率机会会变化。机枪池负责盯住一批候选，优先把资金放到净收益更高的标的上，而不是死拿一个币不动。",
    },
    {
      label: "什么时候会亏钱？",
      value:
        "主要会输在基差突然扩大、滑点/手续费吃掉利润、候选轮换太频繁、或者某个标的 funding 虽高但持续性太差。",
    },
    {
      label: "为什么要看净收益，不只看年化？",
      value:
        "因为年化只是把当前 funding 夸张外推后的理论值。真正能落袋的是扣完手续费、滑点、basis 风险和轮换成本之后剩下的净收益。",
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-bold uppercase tracking-tighter leading-[0.9]" style={{ fontSize: "clamp(2.5rem, 6vw, 6rem)" }}>
          策略与决策
        </h1>
        <p className="text-muted-foreground text-lg mt-2 max-w-4xl">
          通过合成状态展示候选筛选、成本模型与轮换决策。以下参数用于解释原系统设计，不代表正在运行真实策略。
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {runtimeSections.map((section) => (
          <div key={section.title} className="bg-background p-8">
            <h2 className="text-2xl font-bold uppercase tracking-tighter">{section.title}</h2>
            <div className="mt-6 space-y-3 text-sm">
              {section.items.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 border-b border-border pb-3">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
                  <span className="font-mono text-base font-bold break-words">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter mb-6">核心算法</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {algorithmCards.map((card) => (
            <div key={card.title} className="bg-background p-8">
              <h3 className="text-xl font-bold uppercase tracking-tight">{card.title}</h3>
              <p className="text-base text-muted-foreground mt-4">{card.description}</p>
              <div className="mt-6 border-2 border-border p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">公式 / 人话版</p>
                <p className="font-mono text-sm font-bold mt-3">{card.formula}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-2 border-border">
        <div className="px-8 py-6 border-b-2 border-border">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter">策略是否合理？怎么看</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {humanExplanations.map((item) => (
            <div key={item.label} className="bg-background p-8">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.label}</p>
              <p className="text-base leading-7 mt-4 text-foreground/90">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-2 border-border">
        <div className="px-8 py-6 border-b-2 border-border">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter">调参辅助台</h2>
          <p className="text-muted-foreground text-sm mt-2">帮助你理解关键参数的作用，以及调大/调小分别意味着什么。</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {parameterGuides.map((item) => (
            <div key={item.name} className="bg-background p-8">
              <h3 className="text-2xl font-bold uppercase tracking-tight">{item.name}</h3>
              <div className="mt-5 space-y-4 text-sm leading-7">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">它是什么意思</p>
                  <p className="mt-2 text-foreground/90">{item.meaning}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">调大后会怎样</p>
                  <p className="mt-2 text-foreground/90">{item.higher}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">调小 / 关闭后会怎样</p>
                  <p className="mt-2 text-foreground/90">{item.lower}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-2 border-accent bg-accent/5 p-8">
        <h2 className="text-2xl font-bold uppercase tracking-tight">你审查这套策略时，重点看什么？</h2>
        <div className="mt-5 space-y-3 text-base text-foreground/90">
          <p>1. 当前打开仓位数、总敞口、单仓预算是否和风控约束一致</p>
          <p>2. 候选排序是不是按“净收益”而不是只按“高费率”</p>
          <p>3. 轮换是不是有成本感知，而不是一看到更高 funding 就瞎换</p>
          <p>4. 自动止盈、止损、紧急平仓是否和你当前期望一致</p>
          <p>5. 页面上看到的持仓、交易记录、机枪池候选是否前后一致</p>
        </div>
      </section>
    </div>
  );
}
