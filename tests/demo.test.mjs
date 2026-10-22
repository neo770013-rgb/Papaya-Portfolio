import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../src/lib/demo.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const demo = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
test("all demo views work without a network or trading backend", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Unexpected network access"); };
  try {
    for (const route of ["status", "status/live", "refresh", "pool", "logs", "history"]) {
      const response = await demo.demoFetch("/api/agent/" + route);
      assert.equal(response.status, 200);
      assert.ok(await response.json());
    }
    for (const route of ["close", "auto-take-profit", "auth-check"]) {
      assert.equal((await demo.demoFetch("/api/agent/" + route, { method: "POST" })).status, 403);
    }
    assert.equal((await demo.demoFetch("https://unknown.invalid/orders")).status, 403);
  } finally { globalThis.fetch = oldFetch; }
});
test("synthetic candidates, balances and history reconcile", () => {
  assert.equal(demo.demoRates().length, 12);
  const pool = demo.demoPool();
  assert.equal(pool.summary.occupiedSlots, demo.demoStatus().positions.length);
  for (const row of pool.candidates.filter(row=>row.openable)) {
    assert.ok(row.netYieldPct >= row.minNetYieldThresholdPct);
    assert.ok(Math.abs(row.grossYieldPct - row.allInCostPct - row.netYieldPct) < 1e-9);
  }
  const history = demo.demoHistory();
  assert.equal(history.trades.length, history.summary.totalTrades);
  const realized = history.trades.reduce((sum,t)=>sum+(t.realizedPnl || 0),0);
  assert.ok(Math.abs(realized-history.summary.realizedPnl)<1e-9);
  assert.ok(history.trades.every(t=>t.id.startsWith("synthetic-")));
});

test("performance windows reconcile with the same synthetic transaction ledger", () => {
  const history = demo.demoHistory();
  const monthly = demo.demoPerformance(30);
  assert.equal(monthly.startingCapital, 10000);
  assert.equal(monthly.netPnl, history.summary.realizedPnl);
  assert.equal(monthly.closedTrades, history.summary.closedTrades);
  assert.equal(monthly.winRate, history.summary.winRate);
  for (const days of [7,14,30]) {
    const data = demo.demoPerformance(days);
    assert.equal(data.points.length, days + 1);
    assert.equal(data.points.at(-1).value, data.netPnl);
    assert.ok(Math.abs(data.funding + data.trading - data.fees - data.slippage - data.netPnl) < 1e-8);
    assert.ok(Math.abs(data.endingCapital - data.startingCapital - data.netPnl) < 1e-8);
    assert.ok(data.maxDrawdownPct > 0, "Losing days must remain in every displayed window");
    assert.ok(data.winRate < 100);
    assert.ok(Math.abs(data.points.reduce((n,p)=>n+p.daily,0)-data.netPnl)<1e-8);
  }
});
