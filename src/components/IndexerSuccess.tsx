import type { UsenetIndexerStatRow, UsenetWindow } from '../api/types';
import { count, percent } from '../lib/format';

function success(row: UsenetIndexerStatRow): number | undefined {
  if (![row.grabs,row.ok,row.degraded,row.failed].every(n=>Number.isSafeInteger(n) && n>=0)
    || row.ok+row.degraded+row.failed!==row.grabs || !row.grabs) return undefined;
  return (row.ok+row.degraded)/row.grabs;
}
export function IndexerSuccess({ indexers, window }: { indexers: UsenetIndexerStatRow[]; window: UsenetWindow }) {
  const rows=indexers.map(row=>({row,rate:success(row)})).sort((a,b)=>(b.rate ?? -1)-(a.rate ?? -1) || a.row.indexer.localeCompare(b.row.indexer));
  return <section className="card indexer-success" aria-label="Success rate by indexer">
    <h2>Success rate by indexer</h2>
    <p>{window==='all' ? 'All retained activity' : `Last ${window}`} · includes degraded imports</p>
    <ul className="success-bars">{rows.map(({row,rate})=><li key={row.indexer}>
      <div className="success-bar-heading"><span>{row.indexer || 'Unidentified indexer'}</span><strong>{rate===undefined ? row.grabs===0 ? 'No grabs' : 'Unavailable' : percent(rate)}</strong></div>
      {rate!==undefined && <>
        <div className="success-bar-track" role="meter" aria-label={`${row.indexer || 'Unidentified indexer'} success rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate*100} aria-valuetext={percent(rate)}><div style={{width:`${rate*100}%`}}/></div>
        <small>{count(row.ok+row.degraded)} of {count(row.grabs)} grabs successful</small>
      </>}
    </li>)}</ul>
    <div className="success-bar-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
    <p className="success-bars-note">Success includes OK and degraded imports. Indexers with no grabs have no success percentage.</p>
  </section>;
}
