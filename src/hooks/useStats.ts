import { mockStats } from "../lib/mockData";
export function useStats() { return {data: mockStats, loading:false, error:null, refetch:async()=>{}}; }
