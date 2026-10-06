// Read-only admin addon aggregates from AIOStreams 70ffb17a7bb99dd73dbab257af040b04f56eaa42.
// See docs/api-contract.md for percentage units and retention/window limits.
export type AddonRange = '24h' | '7d' | 'all';
export interface AddonAnalytics {
  total: number;
  /** Requests to overridden URLs, not a count of unique endpoints. */
  customEndpoints: number;
  addons: Array<{
    presetId: string;
    requests: number;
    /** Percentages in the range 0–100, unlike Usenet's fractional rates. */
    share: number;
    errors: number;
    errorRate: number;
    errorKinds: Record<string, number>;
    avgLatencyMs: number | null;
  }>;
}
