import { useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { demoPerformance } from "../lib/demo";
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits:2, maximumFractionDigits:2 });
export default function PerformancePanel({compact=false}: {compact?:boolean}) {
  const [days,setDays] = useState<7|14|30>(30);
  const [selected,setSelected] = useState<number|null>(null);
  const data = useMemo(()=>demoPerformance(days),[days]);
  const active = Math.min(selected ?? data.points.length-1,data.points.length-1);
  const low = Math.min(0,...data.points.map(p=>p.value));
  const high = Math.max(1,...data.points.map(p=>p.value))*1.12;
  const x = (i:number)=>52+i/(data.points.length-1)*628;
  const y = (value:number)=>205-(value-low)/(high-low)*170;
  const line = data.points.map((p,i)=>`${x(i)},${y(p.value)}`).join(" ");
  const selectedPoint = data.points[active];
  const selectPoint = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const index = Math.round(((event.clientX - rect.left) / rect.width * 720 - 52) / 628 * (data.points.length - 1));
    setSelected(Math.max(0, Math.min(data.points.length - 1, index)));
  };
  const metrics = [
    ["累计净收益", `+${money(data.netPnl)}`, `+${data.netPct.toFixed(2)}% · USDT`, "profit"],
    ["模拟组合净值", money(data.endingCapital), `期初 ${money(data.startingCapital)} USDT`, ""],
    ["已平仓样本胜率", `${data.winRate.toFixed(0)}%`, `${data.closedTrades} 笔合成样本`, ""],
    ["窗口内最大回撤", `${data.maxDrawdownPct.toFixed(2)}%`, "按已实现净值计算", ""],
  ];
  return <section className={`performance-panel ${compact?"performance-compact":""}`} aria-label="模拟策略收益展示">
    <div className="performance-header"><div><p className="eyebrow">SYNTHETIC PERFORMANCE / 策略收益演示</p><h2>让每一分收益，都有来处。</h2></div><span className="performance-badge">构造场景 · 非实盘 / 非回测</span></div>
    <div className="performance-metrics">{metrics.map(([label,value,note,tone])=><div key={label}><span>{label}</span><strong className={tone==="profit"?"text-green":""}>{value}</strong><small>{note}</small></div>)}</div>
    {!compact && <div className="performance-body"><div className="performance-chart"><div className="performance-chart-top"><div><span className="eyebrow">CUMULATIVE NET P&L · USDT</span><p>{selectedPoint.label} <b className="text-green">{selectedPoint.value>=0?"+":""}{money(selectedPoint.value)}</b><small>当日 {selectedPoint.daily>=0?"+":""}{money(selectedPoint.daily)}</small></p></div><div className="performance-ranges">{([7,14,30] as const).map(n=><button key={n} aria-pressed={days===n} onClick={()=>{setDays(n);setSelected(null);}}>{n}D</button>)}</div></div>
      <svg viewBox="0 0 720 250" className="performance-svg" role="slider" tabIndex={0} aria-label="逐日模拟累计净收益，左右方向键查看" aria-valuemin={0} aria-valuemax={data.points.length-1} aria-valuenow={active} aria-valuetext={`${selectedPoint.label}，累计 ${money(selectedPoint.value)} USDT`}
        onPointerDown={selectPoint} onPointerMove={selectPoint}
        onPointerLeave={event=>{if(event.pointerType==="mouse")setSelected(null);}} onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setSelected(Math.max(0,Math.min(data.points.length-1,active+(e.key==="ArrowLeft"?-1:1))));}}}>
        <defs><linearGradient id="performance-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#0ECB81" stopOpacity="0.24"/><stop offset="1" stopColor="#0ECB81" stopOpacity="0.01"/></linearGradient></defs>
        {[0,1,2,3].map(i=>{const value=low+(high-low)*i/3;return <g key={i}><line x1="52" x2="680" y1={y(value)} y2={y(value)} stroke="#292D2B" strokeDasharray="3 5"/><text x="42" y={y(value)+4} textAnchor="end" fill="#71717A" fontSize="10">{value.toFixed(0)}</text></g>;})}
        <polygon points={`52,205 ${line} 680,205`} fill="url(#performance-fill)"/>
        <polyline points={line} fill="none" stroke="#0ECB81" strokeWidth="2.5" strokeLinejoin="round"/>
        {data.points.map((p,i)=>p.daily<0?<circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#F6465D"/>:null)}
        <line x1={x(active)} x2={x(active)} y1="25" y2="205" stroke="#7D8B83" strokeDasharray="3 4"/>
        <circle cx={x(active)} cy={y(selectedPoint.value)} r="5" fill="#0ECB81" stroke="#F5FFF9" strokeWidth="2"/>
        {[0,Math.floor(data.points.length/2),data.points.length-1].map(i=><text key={i} x={x(i)} y="232" textAnchor="middle" fill="#71717A" fontSize="11">{data.points[i].label}</text>)}
      </svg><div className="chart-legend"><span><i/>累计净收益</span><span><i className="loss"/>亏损样本日</span><span>轻触曲线、移动指针或使用方向键查看</span></div>
    </div><aside className="profit-attribution"><p className="eyebrow">RETURN ATTRIBUTION</p><h3>净收益拆分</h3>{[["资金费收入",data.funding],["双腿价差损益",data.trading],["交易手续费",-data.fees],["滑点成本",-data.slippage]].map(([label,value])=><div className="attribution-line" key={String(label)}><span>{label}</span><b className={Number(value)>=0?"text-green":"text-muted-foreground"}>{Number(value)>=0?"+":"−"}{money(Math.abs(Number(value)))}</b></div>)}<div className="attribution-total"><span>净收益</span><strong>+{money(data.netPnl)}</strong></div><p className="attribution-note">资金费 + 价差损益 − 手续费 − 滑点。所有项目均由同一组合成交易计算。</p></aside></div>}
    <p className="performance-disclosure">模拟初始资金 10,000 USDT。此数据为展示界面与计算口径而构造；不来自真实账户或历史行情回测，不代表预期收益。未实现损益不计入本曲线。</p>
  </section>;
}
