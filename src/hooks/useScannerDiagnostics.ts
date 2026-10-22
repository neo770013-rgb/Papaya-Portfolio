import { useEffect, useState } from "react";
import { api, type ScannerDiagnosticsResponse } from "../lib/api";

export function useScannerDiagnostics(symbols: string[]) {
  const [data, setData] = useState<ScannerDiagnosticsResponse | null>(null);

  useEffect(() => {
    const uniqueSymbols = [...new Set(symbols.filter(Boolean))];
    if (uniqueSymbols.length === 0) {
      setData(null);
      return;
    }

    let cancelled = false;
    api.getScannerDiagnostics(uniqueSymbols)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(symbols)]);

  return { data };
}
