import { useId, useState } from 'react';
import type { AddonAnalytics, AddonRange } from '../api/usageTypes';
import { count } from '../lib/format';

type Addon = AddonAnalytics['addons'][number];
const latency = (row: Addon) => row.requests > 0 ? row.avgLatencyMs : null;
const milliseconds = (value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ms`;

export function AddonResponseTimes({ addons, range }: { addons: Addon[]; range: AddonRange }) {
  const [viewData, setViewData] = useState(false);
  const dataId = useId();
  const rows = addons.slice().sort((a,b) => (latency(b) ?? -1)-(latency(a) ?? -1) || a.presetId.localeCompare(b.presetId));
  const maximum = Math.max(1,rows.reduce((max,row) => Math.max(max,latency(row) ?? 0),0));
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 3));
  const step = ([1,2,2.5,5,10].find(value => value * magnitude >= maximum / 3) ?? 10) * magnitude;
  const intervals = Math.ceil(maximum / step);
  const limit = intervals * step;
  const ticks = Array.from({length:intervals + 1},(_,index) => index * step);
  const recorded = rows.some(row => latency(row) !== null);
  return <section className="card addon-bar-chart addon-response-times" aria-label="Average response times by addon">
    <header className="response-chart-heading">
      <h2>Avg. response times</h2>
      <button type="button" className="text-button" aria-expanded={viewData} aria-controls={dataId} onClick={() => setViewData(value => !value)}>{viewData ? 'Hide data' : 'View data'}</button>
    </header>
    <p>{range === 'all' ? 'All retained daily rollups' : `Last ${range}`} · lower is faster</p>
    <ul className="response-bars">{rows.map((row,index) => {
      const value = latency(row);
      return <li className="response-row" key={`${row.presetId}:${index}`}>
        <span className="response-addon-name">{row.presetId || 'Unnamed preset'}</span>
        {value === null ? <span className="response-unavailable">{row.requests ? 'Unavailable' : 'No requests'}</span> :
          <div className="response-plot" role="meter" aria-label={`${row.presetId || 'Unnamed preset'} average response time`} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={value} aria-valuetext={milliseconds(value)}>
            <div className="response-bar" style={{width:`${value / limit * 100}%`}}><span className="response-bar-value">{milliseconds(value)}</span></div>
          </div>}
      </li>;
    })}</ul>
    {recorded ? <div className="response-axis" aria-hidden="true">
      <div className="response-axis-ticks">{ticks.map((tick,index) => <span key={index} style={{left:`${index / intervals * 100}%`}}>{tick.toLocaleString(undefined,{maximumFractionDigits:3})}</span>)}</div>
      <span className="response-axis-title">Response time (ms)</span>
    </div> : <p className="caption">No response times recorded in this window.</p>}
    <div id={dataId} className="response-data" hidden={!viewData}>
      <table><caption>Recorded preset averages · selected period</caption><thead><tr><th scope="col">Addon</th><th scope="col">Avg. response</th><th scope="col">Requests</th></tr></thead>
        <tbody>{rows.map((row,index) => <tr key={`${row.presetId}:${index}`}><th scope="row">{row.presetId || 'Unnamed preset'}</th><td>{latency(row) === null ? row.requests ? 'Unavailable' : 'No requests' : milliseconds(latency(row)!)}</td><td>{count(row.requests)}</td></tr>)}</tbody>
      </table>
    </div>
  </section>;
}
