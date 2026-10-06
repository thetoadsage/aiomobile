import { describe, expect, it } from 'vitest';
import { providerHealth } from '../src/lib/health';
import { liveUsenet, stats } from './fixtures';
describe('provider health uses upstream state and explicit conditions',()=>{
  const pool=liveUsenet.pool.providers[0];
  it('keeps idle healthy and shows activity independently from connection state',()=>{
    expect(providerHealth({...pool,acquired:0,throughput:0,available:0}).state).toBe('idle');
    expect(providerHealth({...pool,acquired:0,throughput:0,available:0}).warnings).toEqual([]);
    expect(providerHealth({...pool,state:'disabled',tripped:true,queued:5}).warnings).toEqual([]);
    expect(providerHealth({...pool,state:'offline'}).state).toBe('active');
    expect(providerHealth({...pool,tripped:true}).state).toBe('active');
    expect(providerHealth({...pool,acquired:0,queued:1}).state).toBe('active');
    for(const state of ['online','offline','auth_failed'] as const)expect(providerHealth({...pool,state,acquired:0,queued:0,tripped:true,throttled:true}, {...stats.providers[0],missRate:.9,errorRate:.8})).toEqual({state:'idle',label:'Idle',warnings:[]});
  });
  it('warns on measured rates with sufficient samples and on queued capacity',()=>{
    const stat={...stats.providers[0],missRate:.1,errorRate:.05};
    expect(providerHealth({...pool,available:0,queued:1},stat).warnings).toHaveLength(3);
    expect(providerHealth(pool,{...stat,articles:2,missing:1,errors:1}).warnings).toEqual([]);
  });
});
