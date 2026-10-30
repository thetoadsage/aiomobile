import type { CSSProperties } from 'react';
import type { UsenetIndexerStatRow } from '../api/types';
import { count } from '../lib/format';
import { shareTiles } from '../lib/treemap';

const pct = (value: number, total: number) => total ? `${(value/total*100).toLocaleString(undefined,{maximumFractionDigits:1})}%` : '—';
export function IndexerOutcomes({ indexers, label }: { indexers: UsenetIndexerStatRow[]; label: string }) {
  const valid = indexers.every(row => [row.grabs,row.ok,row.degraded,row.failed].every(n => Number.isSafeInteger(n) && n>=0));
  if (!valid) return <p className="caption">Import outcome chart unavailable for this snapshot.</p>;
  const grabs=indexers.reduce((sum,row)=>sum+row.grabs,0);
  if (!grabs) return null;
  const outcomes=[{name:'OK',key:'ok',value:indexers.reduce((sum,row)=>sum+row.ok,0)},
    {name:'Degraded',key:'degraded',value:indexers.reduce((sum,row)=>sum+row.degraded,0)},
    {name:'Failed',key:'failed',value:indexers.reduce((sum,row)=>sum+row.failed,0)}];
  const complete=outcomes[0].value+outcomes[1].value;
  const consistent=outcomes.reduce((sum,row)=>sum+row.value,0)===grabs;
  const rows=indexers.filter(row=>row.grabs>0).slice().sort((a,b)=>b.grabs-a.grabs || a.indexer.localeCompare(b.indexer));
  const tiles=shareTiles(rows.map(row=>row.grabs));
  return <section className="card indexer-outcomes" aria-label="Import outcomes">
    <header><h2>Import outcomes</h2><p>{count(grabs)} grabs · {label}</p></header>
    {consistent ? <div className="outcome-summary">
      <h3>Completion rate</h3>
      <div className="outcome-rate"><strong>{pct(complete,grabs)}</strong><span>completed</span></div>
      <p>{count(complete)} of {count(grabs)} grabs · includes degraded</p>
      <div className="outcome-bar" role="img" aria-label={outcomes.map(row=>`${row.name}: ${count(row.value)}, ${pct(row.value,grabs)}`).join('; ')}>
        {outcomes.map(row=><span key={row.key} className={`outcome-${row.key}`} style={{width:`${row.value/grabs*100}%`}}/>)}
      </div>
      <dl className="outcome-legend">{outcomes.map(row=><div key={row.key}><dt><i className={`outcome-${row.key}`} aria-hidden="true"/>{row.name}</dt><dd><strong>{count(row.value)}</strong><span>{pct(row.value,grabs)}</span></dd></div>)}</dl>
    </div> : <p className="notice">Outcome counts do not match the grab total in this snapshot. Showing grab shares only.</p>}
    <div className="indexer-share-heading"><h3>Grabs by indexer</h3><p>Area represents share of {indexers.length===1 ? 'this indexer’s' : 'all'} grabs</p></div>
    <div className="indexer-treemap" role="img" aria-label={`Grab shares: ${rows.map(row=>`${row.indexer || 'Unidentified indexer'}: ${count(row.grabs)} grabs, ${pct(row.grabs,grabs)}`).join('; ')}`}>
      {tiles.map(tile=>{
        const row=rows[tile.index];
        return <div key={row.indexer} className="indexer-share-tile" style={{left:`${tile.x}%`,top:`${tile.y}%`,width:`${tile.width}%`,height:`${tile.height}%`,'--tile-tone':`var(--share-${tile.index%6})`} as CSSProperties} title={`${row.indexer || 'Unidentified indexer'} · ${count(row.grabs)} grabs · ${pct(row.grabs,grabs)}`} aria-hidden="true">
          <div className="share-tile-content"><span className="share-tile-name">{row.indexer || 'Unidentified indexer'}</span><strong>{pct(row.grabs,grabs)}</strong><small>{count(row.grabs)} grabs</small></div>
        </div>;
      })}
    </div>
    <div className="share-breakdown" aria-label="All indexer shares"><dl>{rows.map((row,index)=><div key={row.indexer} style={{'--tile-tone':`var(--share-${index%6})`} as CSSProperties}><dt><i aria-hidden="true"/>{row.indexer || 'Unidentified indexer'}</dt><dd>{count(row.grabs)} grabs · {pct(row.grabs,grabs)}</dd></div>)}</dl></div>
  </section>;
}
