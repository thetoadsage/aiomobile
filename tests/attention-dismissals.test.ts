import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectAttention } from '../src/lib/attention';
import { attentionDismissalKey, dismissAttention, isAttentionDismissed, readAttentionDismissals, reconcileAttentionDismissals, writeAttentionDismissals } from '../src/lib/attentionDismissals';
import { stats } from './fixtures';
const now=100000;
const scope='https://instance.example';
const item=collectAttention([],{...stats,indexers:[{...stats.indexers[0],indexer:'Private indexer'}]})[0];
afterEach(()=>vi.unstubAllGlobals());
describe('device-local health alert dismissal',()=>{
  it('hides acknowledged counts, including decreases, but exposes new or increased problems',()=>{
    const saved=dismissAttention([item],scope,{},now);
    expect(isAttentionDismissed(item,scope,saved,now)).toBe(true);
    expect(isAttentionDismissed({...item,signals:{...item.signals,failed:1}},scope,saved,now)).toBe(true);
    expect(isAttentionDismissed({...item,signals:{...item.signals,failed:item.signals.failed+1}},scope,saved,now)).toBe(false);
    expect(isAttentionDismissed({...item,signals:{...item.signals,auth:1}},scope,saved,now)).toBe(false);
    expect(isAttentionDismissed({...item,signals:{...item.signals,lastError:Date.now()}},scope,saved,now)).toBe(false);
  });
  it('isolates sources and instances, expires after 24h, and stores no raw names or messages',()=>{
    const saved=dismissAttention([item],scope,{},now);
    expect(isAttentionDismissed({...item,id:'indexer:Another'},scope,saved,now)).toBe(false);
    expect(isAttentionDismissed(item,'https://another.example',saved,now)).toBe(false);
    expect(isAttentionDismissed(item,scope,saved,now+86400000)).toBe(false);
    expect(JSON.stringify(saved)).not.toMatch(/Private|indexer|example|failed|lastError/);
  });
  it('rearms observed healthy sources and resolved reasons without treating a missing source as healthy',()=>{
    const provider={id:'provider:1',title:'Provider',details:'Tripped',href:'#provider/1',signals:{tripped:1,throttled:1}};
    const saved=dismissAttention([provider],scope,{},now);
    expect(reconcileAttentionDismissals([],[],scope,saved,now)).toBe(saved);
    const partial=reconcileAttentionDismissals([{...provider,signals:{tripped:1}}],[provider.id],scope,saved,now);
    expect(isAttentionDismissed({...provider,signals:{tripped:1}},scope,partial,now)).toBe(true);
    expect(isAttentionDismissed(provider,scope,partial,now)).toBe(false);
    expect(reconcileAttentionDismissals([],[provider.id],scope,saved,now)).toEqual({});
  });
  it('loads only valid, unexpired preferences and tolerates blocked storage',()=>{
    const saved=dismissAttention([item],scope,{},now);
    vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(saved),setItem:vi.fn()});
    expect(readAttentionDismissals(now)).toEqual(saved);
    expect(readAttentionDismissals(now+86400000)).toEqual({});
    writeAttentionDismissals(saved);expect(localStorage.setItem).toHaveBeenCalledWith(attentionDismissalKey,JSON.stringify(saved));
    vi.stubGlobal('localStorage',{getItem:()=>'{broken',setItem:()=>{throw new Error('storage blocked');}});
    expect(readAttentionDismissals(now)).toEqual({});expect(()=>writeAttentionDismissals(saved)).not.toThrow();
  });
});
