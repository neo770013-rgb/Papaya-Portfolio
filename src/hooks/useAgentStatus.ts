import { demoFetch as operatorFetch } from "../lib/demo";
import { useState, useEffect, useCallback } from "react";
import type { AgentStatus, AgentStatusErrorDetail } from "../lib/api";

const POLL_INTERVAL = 30_000;

async function readErrorDetail(res: Response): Promise<AgentStatusErrorDetail> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") {
      return { message: body.detail };
    }
    if (typeof body?.detail?.message === "string") {
      return {
        code: typeof body.detail.code === "string" ? body.detail.code : undefined,
        message: body.detail.message,
        updatedAt: typeof body.detail.updatedAt === "string" ? body.detail.updatedAt : null,
        ageSeconds: typeof body.detail.ageSeconds === "number" ? body.detail.ageSeconds : null,
        maxAgeSeconds: typeof body.detail.maxAgeSeconds === "number" ? body.detail.maxAgeSeconds : null,
      };
    }
  } catch {
    // ignore JSON parse errors and fall back to status code
  }
  return { message: `API ${res.status}` };
}

export function useAgentStatus() {
  const [data, setData] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<AgentStatusErrorDetail | null>(null);

  const fetchStatus = useCallback(async (live = false) => {
    try {
      const res = await operatorFetch(live ? "/api/agent/status/live" : "/api/agent/status");
      if (!res.ok) {
        const detail = await readErrorDetail(res);
        throw Object.assign(new Error(detail.message), { detail });
      }
      const json = await res.json();
      setData(json);
      setError(null);
      setErrorDetail(null);
      return json;
    } catch (e) {
      setData(null);
      const detail = e instanceof Error && "detail" in e ? (e as Error & { detail?: AgentStatusErrorDetail }).detail ?? null : null;
      setError(detail?.message ?? (e instanceof Error ? e.message : "Network error"));
      setErrorDetail(detail);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await operatorFetch("/api/agent/refresh", { method: "POST" });
      if (!res.ok) {
        const detail = await readErrorDetail(res);
        throw Object.assign(new Error(detail.message), { detail });
      }
      const json = await res.json();
      setData(json);
      setError(null);
      setErrorDetail(null);
      return json;
    } catch (e) {
      setData(null);
      const detail = e instanceof Error && "detail" in e ? (e as Error & { detail?: AgentStatusErrorDetail }).detail ?? null : null;
      setError(detail?.message ?? (e instanceof Error ? e.message : "Network error"));
      setErrorDetail(detail);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const closePosition = useCallback(async () => {
    setLoading(true);
    try {
      const res = await operatorFetch("/api/agent/close", { method: "POST" });
      if (!res.ok) {
        const detail = await readErrorDetail(res);
        throw Object.assign(new Error(detail.message), { detail });
      }
      const json = await res.json();
      if (json.postCloseStatus) setData(json.postCloseStatus);
      setError(null);
      setErrorDetail(null);
      return json;
    } catch (e) {
      setData(null);
      const detail = e instanceof Error && "detail" in e ? (e as Error & { detail?: AgentStatusErrorDetail }).detail ?? null : null;
      setError(detail?.message ?? (e instanceof Error ? e.message : "Network error"));
      setErrorDetail(detail);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return { data, loading, error, errorDetail, refetch: fetchStatus, refresh, closePosition };
}
