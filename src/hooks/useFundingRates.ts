import { useEffect, useState } from "react";
import { demoRates } from "../lib/demo";
export function useFundingRates() {
  const [data, setData] = useState(demoRates);
  useEffect(() => { const id = setInterval(() => setData(demoRates()), 1000); return () => clearInterval(id); }, []);
  return { data, loading: false, error: null, refetch: () => setData(demoRates()) };
}
