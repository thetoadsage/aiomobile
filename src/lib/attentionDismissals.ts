import type { AttentionItem } from './attention';

export const attentionDismissalKey = 'aiomobile.attention-dismissals';
const day = 24 * 60 * 60 * 1000;
export interface Dismissal { until: number; signals: Record<string,number> }
export type AttentionDismissals = Record<string,Dismissal>;

// Opaque preference identifiers, not encryption. Never persist names or error text.
function preferenceId(value: string) {
  let a=2166136261,b=3339675911;
  for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b^value.charCodeAt(i),2246822519);}
  return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
const sourceId = (scope:string,id:string) => preferenceId(JSON.stringify([scope,id]));
const signalIds = (item:AttentionItem) => Object.fromEntries(Object.entries(item.signals).map(([name,value])=>[preferenceId(name),value]));
export function readAttentionDismissals(now=Date.now()): AttentionDismissals {
  try {
    const raw:unknown=JSON.parse(localStorage.getItem(attentionDismissalKey) || '{}');
    if(!raw || typeof raw!=='object' || Array.isArray(raw))return {};
    return Object.fromEntries(Object.entries(raw).filter(([key,row])=>/^[0-9a-f]{16}$/.test(key) && row && typeof row==='object' && Number.isFinite(row.until) && row.until>now && row.until<=now+day && row.signals && typeof row.signals==='object' && !Array.isArray(row.signals) && Object.entries(row.signals).every(([key,value])=>/^[0-9a-f]{16}$/.test(key) && typeof value==='number' && Number.isFinite(value) && value>=0)));
  } catch {return {};}
}
export function writeAttentionDismissals(value:AttentionDismissals) {
  try {localStorage.setItem(attentionDismissalKey,JSON.stringify(value));} catch { /* Dismissal still works for this visit when storage is unavailable. */ }
}
export function isAttentionDismissed(item:AttentionItem,scope:string,dismissals:AttentionDismissals,now=Date.now()) {
  const saved=dismissals[sourceId(scope,item.id)];
  return !!saved && saved.until>now && Object.entries(signalIds(item)).every(([key,value])=>(saved.signals[key] ?? -1)>=value);
}
export function dismissAttention(items:AttentionItem[],scope:string,dismissals:AttentionDismissals,now=Date.now()):AttentionDismissals {
  const next={...dismissals};
  for(const item of items)next[sourceId(scope,item.id)]={until:now+day,signals:signalIds(item)};
  return next;
}
/** Only prune against observed healthy sources, never an unavailable or empty feed. */
export function reconcileAttentionDismissals(items:AttentionItem[],knownSourceIds:string[],scope:string,dismissals:AttentionDismissals,now=Date.now()):AttentionDismissals {
  const current=new Map(items.map(item=>[sourceId(scope,item.id),signalIds(item)]));
  const known=new Set(knownSourceIds.map(id=>sourceId(scope,id)));
  let changed=false;
  const entries=Object.entries(dismissals).flatMap(([key,saved])=>{
    if(saved.until<=now || known.has(key) && !current.has(key)){changed=true;return [];}
    if(!known.has(key))return [[key,saved] as const];
    const signals=Object.fromEntries(Object.entries(saved.signals).filter(([signal])=>Object.hasOwn(current.get(key)!,signal)));
    if(Object.keys(signals).length!==Object.keys(saved.signals).length){changed=true;return [[key,{...saved,signals}] as const];}
    return [[key,saved] as const];
  });
  return changed ? Object.fromEntries(entries) : dismissals;
}
