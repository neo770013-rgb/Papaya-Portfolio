import { demoFetch as operatorFetch } from "../lib/demo";
import { useState, useEffect, useCallback } from "react";
import type { AgentPoolState } from "../lib/api";

const POLL_INTERVAL = 30_000;

export function useAgentPool() {
  const [data, setData] = useState<AgentPoolState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPool = useCallback(async () => {
    try {
      const res = await operatorFetch("/api/agent/pool");
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      setData(json);
      return json;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPool();
    const interval = setInterval(fetchPool, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPool]);

  return { data, loading, refetch: fetchPool };
}
