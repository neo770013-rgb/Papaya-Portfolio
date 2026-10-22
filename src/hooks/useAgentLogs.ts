import { demoFetch as operatorFetch } from "../lib/demo";
import { useState, useEffect, useCallback } from "react";
import type { AgentLogs } from "../lib/api";

const POLL_INTERVAL = 15_000;

export function useAgentLogs() {
  const [data, setData] = useState<AgentLogs>({ lines: [], autoTakeProfit: false });
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await operatorFetch("/api/agent/logs");
      if (!res.ok) throw new Error("Failed to load logs");
      const json = await res.json();
      setData(json);
      return json;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleAutoTakeProfit = useCallback(async (enabled: boolean) => {
    const res = await operatorFetch("/api/agent/auto-take-profit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error("Failed to toggle auto take profit");
    const json = await res.json();
    setData((prev) => ({ ...prev, autoTakeProfit: json.enabled }));
    return json;
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return { data, loading, refetch: fetchLogs, toggleAutoTakeProfit };
}
