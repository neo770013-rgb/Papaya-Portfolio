import { useEffect } from "react";
import { Routes, Route, NavLink, Link, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import Strategy from "./pages/Strategy";
import TradeHistory from "./pages/TradeHistory";
import Settings from "./pages/Settings";
import GitHubLink from "./components/GitHubLink";
import { GITHUB_REPOSITORY } from "./lib/project";
const links = [["/", "项目概览"], ["/scanner", "费率扫描"], ["/trade-history", "交易样本"], ["/strategy", "策略设计"], ["/project", "工程说明"]];
export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <div className="min-h-screen bg-background text-foreground">
    <header className="site-header"><div className="site-shell header-inner">
      <Link to="/" className="brand" aria-label="Papaya 首页"><span className="brand-mark">P</span>PAPAYA<span className="brand-sub">ENGINEERING<br/>PROJECT / 001</span></Link>
      <nav aria-label="主导航">{links.map(([to,label])=><NavLink key={to} to={to} end={to === "/"} className={({isActive})=>isActive?"nav-link active":"nav-link"}>{label}</NavLink>)}</nav>
      <GitHubLink />
    </div></header>
    <div className="demo-strip"><div className="site-shell flex flex-wrap items-center justify-between gap-2"><span><span className="status-dot"/>作品集交互演示</span><span>全部为合成数据 · 不连接账户 · 不执行真实交易</span></div></div>
    <main className="site-shell py-10 md:py-16"><Routes>
      <Route path="/" element={<Home/>}/><Route path="/scanner" element={<Scanner/>}/>
      <Route path="/trade-history" element={<TradeHistory/>}/><Route path="/strategy" element={<Strategy/>}/>
      <Route path="/project" element={<Settings/>}/><Route path="/settings" element={<Navigate to="/project" replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></main>
    <footer className="site-shell footer"><span>PAPAYA <span className="text-muted-foreground">/ Funding Rate Arbitrage</span></span><span>工程作品展示 · 演示数据不构成收益证明</span><a href={GITHUB_REPOSITORY} target="_blank" rel="noopener noreferrer">GitHub · neo770013-rgb ↗</a><Link to="/project">阅读项目说明 ↗</Link></footer>
  </div>;
}
