import type { AddonAnalytics } from '../src/api/usageTypes';
// Synthetic aggregate data only. No addon URL or provider request is made.
export const addonAnalytics: AddonAnalytics = {
  total:2400,customEndpoints:17,
  addons:Array.from({length:24},(_,i): AddonAnalytics['addons'][number] => ({presetId:`Recorded preset ${i+1}`,requests:100,share:4.2,errors:i%3 === 0 ? 6 : 0,errorRate:i%3 === 0 ? 6 : 0,errorKinds:i%3 === 0 ? {timeout:4,unavailable:2} : {},avgLatencyMs:i === 0 ? null : 150+i*20})),
};
