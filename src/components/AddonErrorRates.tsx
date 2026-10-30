import { useId, useState } from 'react';
import type { AddonAnalytics, AddonRange } from '../api/usageTypes';
import { count } from '../lib/format';

export function AddonErrorRates({ addons, range }: { addons: AddonAnalytics['addons']; range: AddonRange }) {
  const [viewData,setViewData] = useState(false);
  const dataId = useId();
  const rows = addons.slice().sort((a,b) => (b.requests ? b.errorRate : -1)-(a.requests ? a.errorRate : -1) || a.presetId.localeCompare(b.presetId));
  return <section className="card addon-bar-chart addon-error-rates" aria-label="Error rate by addon">
    <header className="response-chart-heading">
      <h2>Error rate by addon</h2>
      <button type="button" className="text-button" aria-expanded={viewData} aria-controls={dataId} onClick={() => setViewData(value => !value)}>{viewData ? 'Hide data' : 'View data'}</button>
    </header>
    <p>{range === 'all' ? 'All retained daily rollups' : `Last ${range}`} · lower is better</p>
    <ul className="response-bars">{rows.map((row,index) => <li className="response-row" key={`${row.presetId}:${index}`}>
      <span className="response-addon-name">{row.presetId || 'Unnamed preset'}</span>
      {row.requests > 0 ? <div className="response-plot" role="meter" aria-label={`${row.presetId || 'Unnamed preset'} error rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={row.errorRate} aria-valuetext={`${row.errorRate.toFixed(1)}%`}>
        <div className="response-bar" style={{width:`${row.errorRate}%`}}><span className="response-bar-value">{row.errorRate.toFixed(1)}%</span></div>
      </div> : <span className="response-unavailable">No requests</span>}
    </li>)}</ul>
    <div className="response-axis" aria-hidden="true">
      <div className="response-axis-ticks">{[0,25,50,75,100].map(value => <span key={value} style={{left:`${value}%`}}>{value}%</span>)}</div>
      <span className="response-axis-title">Error rate (%)</span>
    </div>
    <div id={dataId} className="response-data" hidden={!viewData}>
      <table><caption>Recorded preset errors · selected period</caption><thead><tr><th scope="col">Addon</th><th scope="col">Error rate</th><th scope="col">Errors</th><th scope="col">Requests</th></tr></thead>
        <tbody>{rows.map((row,index) => <tr key={`${row.presetId}:${index}`}><th scope="row">{row.presetId || 'Unnamed preset'}</th><td>{row.requests ? `${row.errorRate.toFixed(1)}%` : 'No requests'}</td><td>{count(row.errors)}</td><td>{count(row.requests)}</td></tr>)}</tbody>
      </table>
    </div>
  </section>;
}
