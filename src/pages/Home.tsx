import { useState } from "react";
import { Link } from "react-router-dom";
import { demoRates, demoStatus, demoPerformance } from "../lib/demo";
import PerformancePanel from "../components/PerformancePanel";
import GitHubLink from "../components/GitHubLink";
const scenarios = [
  {name:"正常费率", rate:0.08, basis:0.06, text:"资金费率覆盖成本后，再进入候选池。", tone:"green"},
  {name:"基差扩大", rate:0.08, basis:0.72, text:"高费率不等于好机会：基差风险可以吞掉收益。", tone:"red"},
  {name:"费率转负", rate:-0.02, basis:0.06, text:"费率方向变化时，现货多 + 合约空不再适用。", tone:"red"},
];
export default function Home() {
  const [scenario, setScenario] = useState(0);
  const [periods, setPeriods] = useState(6);
  const current = scenarios[scenario];
  const net = current.rate * periods - 0.28 - 0.05 - current.basis;
  const rates = demoRates();
  const positions = demoStatus().positions;
  const performance = demoPerformance();
  const miniLine = performance.points.map((p,i)=>`${i/(performance.points.length-1)*420},${104-p.value/480*94}`).join(" ");
  return <div className="portfolio-home">
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">FINTECH × FULL STACK ENGINEERING</p>
        <h1>让套利决策<br/><span>看得见。</span></h1>
        <p className="hero-description">从资金费率扫描，到成本过滤与双腿对冲。<br className="hidden md:block"/>把交易策略，变成可解释、可观察的工程系统。</p>
        <div className="hero-actions"><Link className="cta-primary" to="/scanner">进入交互演示 <span>↗</span></Link><Link className="cta-secondary" to="/project">阅读工程说明 →</Link></div>
        <GitHubLink prominent />
        <div className="tech-tags">{["React", "TypeScript", "FastAPI", "REST / WebSocket"].map(t=><span key={t}>{t}</span>)}</div>
      </div>
      <div className="terminal-board">
        <div className="board-top"><span className="eyebrow">STRATEGY OBSERVATORY</span><span className="demo-label">SYNTHETIC DATA</span></div>
        <div className="board-heading"><div><p>近 30 天模拟净收益</p><strong><span>+{performance.netPct.toFixed(2)}%</span></strong></div><span className="orbit">↗</span></div>
        <div className="legs"><div><span className="text-green">↗</span> SPOT LONG</div><span>+</span><div><span className="text-accent">↘</span> PERP SHORT</div></div>
        <div className="hero-profit-amount"><b>+{performance.netPnl.toFixed(2)} <small>USDT</small></b><span>30 天构造场景 · 非实盘</span></div>
        <svg viewBox="0 0 420 112" className="hero-chart" role="img" aria-label="30 天合成净收益曲线，含亏损日"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#DFE104" stopOpacity="0.25"/><stop offset="1" stopColor="#DFE104" stopOpacity="0"/></linearGradient></defs><path d="M0 95H420M0 60H420M0 25H420" stroke="#27272A" strokeDasharray="3 5"/><polygon points={`0,112 ${miniLine} 420,112`} fill="url(#chartFill)"/><polyline points={miniLine} stroke="#DFE104" strokeWidth="2.5" fill="none"/></svg>
        <div className="board-table"><div className="board-row muted"><span>模拟标的</span><span>费率 / 8H</span><span>仓位状态</span></div>{positions.map(p=><div className="board-row" key={p.symbol}><b>{p.symbol}</b><span className="text-accent">+{(p.fundingRate*100).toFixed(3)}%</span><span className="text-green">● 已对冲</span></div>)}</div>
        <div className="board-bottom"><span>◉ 演示环境 / 无交易权限</span><Link to="/trade-history">查看样本 →</Link></div>
      </div>
    </section>
    <div className="project-facts">{[["12", "组合成行情"], ["03", "策略过滤维度"], ["02", "腿对冲模型"], ["00", "真实交易请求"]].map(([v,l])=><div key={l}><strong>{v}</strong><span>{l}</span></div>)}</div>
    <PerformancePanel />
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">01 / EXPLORE THE SYSTEM</p><h2>不是只看收益，<br/>更要看决策过程。</h2></div><p>选择一个模块，查看它如何把市场信号转化为可解释的状态。所有样本由浏览器本地生成。</p></div>
      <div className="explore-grid">{[
        ["/scanner", "01", "机会扫描", "搜索与排序 12 组行情，观察基差、流动性和成本如何影响候选池。", "SCAN & FILTER"],
        ["/trade-history", "02", "交易生命周期", "从 OPEN 到 CLOSED，查看合成样本中的仓位数量、收益口径和退出原因。", "STATE & ATTRIBUTION"],
        ["/strategy", "03", "策略可解释性", "理解净收益模型、风险阈值与轮换门槛，避免只看表面年化。", "REASON & ROTATE"],
      ].map(([to,n,title,desc,label])=><Link className="explore-card" key={to} to={to}><span className="card-num">{n}</span><span className="card-arrow">↗</span><p className="eyebrow">{label}</p><h3>{title}</h3><p>{desc}</p></Link>)}</div>
    </section>
    <section className="scenario-section"><div><p className="eyebrow">02 / TRY A SCENARIO</p><h2>高费率，<br/>一定值得入场？</h2><p className="text-muted-foreground mt-5 leading-7">切换合成场景，看看成本如何改变判断。<br/>这是简化计算器，用于解释设计思路。</p><Link to="/strategy" className="inline-block mt-6 text-accent">查看完整策略模型 →</Link></div>
      <div className="scenario-panel"><div className="scenario-tabs">{scenarios.map((s,i)=><button aria-pressed={scenario===i} key={s.name} className={scenario===i?"selected":""} onClick={()=>setScenario(i)}>{s.name}</button>)}</div>
        <label className="block text-sm mt-6" htmlFor="periods">持有期数 <span className="float-right font-mono text-accent">{periods} × 8H</span></label><input id="periods" className="w-full my-4 accent-[#DFE104]" type="range" min="1" max="12" value={periods} onChange={e=>setPeriods(Number(e.target.value))}/>
        <div className="cost-lines"><div><span>合成资金费率 × 期数</span><b>{current.rate.toFixed(2)}% × {periods}</b></div><div><span>双向手续费 + 滑点</span><b>0.28% + 0.05%</b></div><div><span>基差风险成本</span><b>{current.basis.toFixed(2)}%</b></div></div>
        <div className="scenario-result"><span>简化预估净收益<br/><small>非真实收益 / 不含全部风险</small></span><strong className={net>0 && current.rate>0?"text-green":"text-red"}>{net>=0?"+":""}{net.toFixed(2)}%</strong></div><p className="text-sm text-muted-foreground mt-4">{current.text}</p>
      </div>
    </section>
    <section className="section-block engineering-section"><div><p className="eyebrow">03 / BEHIND THE INTERFACE</p><h2>界面之下，<br/>是工程边界。</h2><p className="hero-description">原项目包含 FastAPI 后端与测试网执行器；本展示站将演示数据与账户操作彻底分离。</p><Link className="cta-secondary inline-block mt-6" to="/project">技术架构与项目取舍 ↗</Link></div><div className="engineering-list">{[["可观察", "把候选过滤原因、执行状态和收益口径呈现在界面。"],["可恢复", "原执行器使用事务状态、订单终态确认与异常恢复路径。"],["有边界", "原后端加入独立操作者认证；本站不包含账户接口。"]].map(([a,b])=><div key={a}><b>{a}</b><p>{b}</p></div>)}</div></section>
    <p className="text-xs text-muted-foreground border-t border-border pt-5">数据说明：行情、仓位、曲线和交易记录均为合成示例。曲线及指标共用合成交易计算；不展示实盘业绩，不承诺策略收益。当前演示覆盖 {rates.length} 个标的。</p>
  </div>;
}
