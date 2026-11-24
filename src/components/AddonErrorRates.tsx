import { useId, useState } from 'react';
import type { AddonAnalytics, AddonRange } from '../api/usageTypes';
import { count } from '../lib/format';

export type AddonRanking = 'count' | 'rate';

export function AddonErrorRates({ addons, range, ranking, setRanking }: {
  addons: AddonAnalytics['addons'];
  range: AddonRange;
  ranking: AddonRanking;
  setRanking: (ranking: AddonRanking) => void;
}) {
  const [viewData,setViewData] = useState(false);
  const dataId = useId();
  const byRate = ranking === 'rate';
  const measure = (row: AddonAnalytics['addons'][number]) => byRate ? row.requests ? row.errorRate : -1 : row.errors;
  const label = byRate ? 'Error rate' : 'Error count';
  const rows = addons.slice().sort((a,b) => measure(b) - measure(a) || a.presetId.localeCompare(b.presetId));
  const maximum = byRate ? 100 : Math.max(1, rows[0]?.errors ?? 0);
  const ticks = [...new Set([0, 1, 2, 3, 4].map(step => Math.round(step * maximum / 4)))];
  return <section className="card addon-bar-chart addon-error-rates" aria-label="Addon impact">
    <header className="response-chart-heading">
      <h2>Addon impact</h2>
      <button type="button" className="text-button" aria-expanded={viewData} aria-controls={dataId} onClick={() => setViewData(value => !value)}>{viewData ? 'Hide data' : 'View data'}</button>
    </header>
    <p>{range === 'all' ? 'All retained daily rollups' : `Last ${range}`}</p>
    <div className="segmented addon-ranking" role="group" aria-label="Rank addons by">
      <button type="button" aria-pressed={!byRate} onClick={() => setRanking('count')}>Error count</button>
      <button type="button" aria-pressed={byRate} onClick={() => setRanking('rate')}>Error rate</button>
    </div>
    <ul className="response-bars">{rows.map((row,index) => {
      const value = measure(row);
      const display = byRate ? `${row.errorRate.toFixed(1)}%` : count(row.errors);
      return <li className="response-row" key={`${row.presetId}:${index}`}>
        <div className="response-addon-name">{row.presetId || 'Unnamed preset'}
          <small>{count(row.errors)} / {count(row.requests)} errors · {row.requests ? `${row.errorRate.toFixed(1)}%` : 'Rate unavailable'}</small>
        </div>
        {value >= 0 ? <div className="response-plot" role="meter" aria-label={`${row.presetId || 'Unnamed preset'} ${label.toLowerCase()}`} aria-valuemin={0} aria-valuemax={maximum} aria-valuenow={value} aria-valuetext={byRate ? display : `${display} recorded errors`}>
          <div className="response-bar" style={{width:`${value / maximum * 100}%`}}><span className="response-bar-value">{display}</span></div>
        </div> : <span className="response-unavailable">No requests</span>}
      </li>;
    })}</ul>
    <div className="response-axis" aria-hidden="true">
      <div className="response-axis-ticks">{ticks.map(value => <span key={value} style={{left:`${value / maximum * 100}%`}}>{byRate ? `${value}%` : count(value)}</span>)}</div>
      <span className="response-axis-title">{byRate ? 'Error rate (%)' : 'Recorded errors'}</span>
    </div>
    <div id={dataId} className="response-data" hidden={!viewData}>
      <table><caption>Recorded preset errors · selected period</caption><thead><tr><th scope="col">Addon</th><th scope="col">Error rate</th><th scope="col">Errors</th><th scope="col">Requests</th></tr></thead>
        <tbody>{rows.map((row,index) => <tr key={`${row.presetId}:${index}`}><th scope="row">{row.presetId || 'Unnamed preset'}</th><td>{row.requests ? `${row.errorRate.toFixed(1)}%` : 'No requests'}</td><td>{count(row.errors)}</td><td>{count(row.requests)}</td></tr>)}</tbody>
      </table>
    </div>
  </section>;
}
