# Papaya · 资金费率套利系统作品集

**[在线演示](https://papaya-arbitrage-portfolio.alylwxy.chatgpt.site/) · [GitHub 源码](https://github.com/neo770013-rgb/Papaya-Portfolio) · [维护者 @neo770013-rgb](https://github.com/neo770013-rgb)**

这是 Papaya 项目的公开作品集前端，供招聘与工程交流使用。源码与在线演示相互链接，方便查看实现与运行效果。

> 行情、持仓、交易记录和收益曲线均为合成场景。本站不连接真实账户、不发送真实交易请求、不收集用户密钥；收益不代表实盘或历史回测。

## 可以体验什么

- **项目概览**：技术背景、模块导览、简化策略场景计算器。
- **费率扫描**：12 组合成行情，支持搜索、排序、信号与候选池过滤。
- **模拟收益**：7 / 14 / 30 天累计净收益曲线、组合净值、胜率与回撤，以及资金费/价差/手续费/滑点拆分。
- **交易样本**：合成开平仓记录、盈亏归因、状态筛选与按需加载。
- **策略及工程说明**：成本模型、双腿对冲、状态恢复、安全边界与设计取舍。

## 技术与架构

React 18、TypeScript、Vite、Tailwind CSS。使用 HashRouter，所有交互在浏览器内运行，可直接部署到静态托管平台。

```text
src/lib/demo.ts               合成数据源与收益口径
src/components/PerformancePanel.tsx  收益曲线与指标
src/pages/Scanner.tsx         扫描与过滤
src/pages/TradeHistory.tsx    交易样本
src/pages/Settings.tsx        工程说明
src/lib/project.ts           GitHub 与演示站地址
```

此仓库仅包含演示站。原交易执行器、账户配置和私有运行历史不在本仓库中；原项目继续保持私有。保留原 MIT 许可证。

## 本地运行与验证

需要 Node.js 20.19+ 或 22.12+（推荐较新 LTS）。

```sh
git clone https://github.com/neo770013-rgb/Papaya-Portfolio.git
cd Papaya-Portfolio
npm ci
npm run dev
```

默认本地地址为 `http://127.0.0.1:5174/`。

```sh
npm test
npm run build
```

测试覆盖无网络演示、真实操作拒绝、净收益与交易账本一致性、不同收益窗口的成本与回撤口径。构建后 `dist/` 可部署到静态托管平台。分享子页面可使用 `/#/scanner`、`/#/trade-history` 等路径。

## 数据与安全边界

- 合成初始资金为 10,000 USDT，30 天样本含亏损日，全部收益指标从同一组样本计算。
- 未实现损益不计入已实现净收益曲线。
- 不含 `.env`、API Secret、交易后台、真实订单、个人本机路径或原项目 Git 历史。
- 部署平台的账户级配置不随公开源码提供，其他人可在自己的静态托管环境部署。

## 许可

[MIT](LICENSE)。维护者：[@neo770013-rgb](https://github.com/neo770013-rgb)。
