import { useState, type ReactNode } from 'react';
import type { BandwidthOverview, LiveStats, LiveStreams, UsenetStatsOverview } from '../api/types';
import type { Resource } from '../hooks/useData';
import { bytes } from '../lib/format';
import { providerHealth } from '../lib/health';
import { Section, Empty, Status } from '../components/UI';
import { Chart } from '../components/Chart';
import { Icon } from '../components/Icon';
import { Attention } from '../components/Attention';
import { OverviewCustomizer } from '../components/OverviewCustomizer';
import { orderedOverview, type OverviewSectionId, type OverviewSectionPreference } from '../lib/overview';
import { saveSettings, type Settings } from '../lib/settings';
import { SystemCard, RecentWarnings } from '../components/InstanceHealth';
import type { SystemMetrics } from '../api/monitoringTypes';
import type { LogSnapshot } from '../api/logTypes';
import { StreamList } from '../components/StreamList';
import { visibleTransfers, type FilePositions } from '../lib/streams';
import { LiveActivity } from '../components/LiveActivity';
import { ServerVersion } from '../components/ServerVersion';

export function Overview({ positions, system, warnings, streams, usenet, bandwidth, loginUrl, open, navigate, stats, settings, save }: { positions: FilePositions; system:Resource<SystemMetrics>; warnings:Resource<LogSnapshot>; streams: Resource<LiveStreams>; usenet: Resource<LiveStats>; bandwidth: Resource<BandwidthOverview>; loginUrl: string; open: (id: string) => void; navigate: () => void; stats: Resource<UsenetStatsOverview>; settings: Settings; save: (settings: Settings) => void }) {
  const [customizing, setCustomizing] = useState(false);
  const [layoutError, setLayoutError] = useState('');
  const [layoutMessage, setLayoutMessage] = useState('');
  const changeLayout = (overview: OverviewSectionPreference[]) => {
    setLayoutError('');setLayoutMessage('');
    try { const next = { ...settings, overview };saveSettings(next);save(next);setLayoutMessage('Overview layout saved.'); }
    catch { setLayoutError('Could not save the layout. Check your browser storage settings and try again.'); }
  };
  const visibleStreams = visibleTransfers(streams.data?.streams ?? [], settings.showAllTransfers);
  const providers = usenet.data?.pool.providers ?? [];
  const health = providers.map(p => providerHealth(p, stats.data?.providers.find(row => row.id === p.id)));
  const active = health.filter(p => p.state === 'active').length;
  const idle = health.filter(p => p.state === 'idle').length;
  const disabled = providers.length - active - idle;
  const issues = health.filter(p => p.warnings.length > 0).length;
  const shown = orderedOverview(settings.overview).filter(section => section.visible);
  const sections: Record<OverviewSectionId, ReactNode> = {
    version: <ServerVersion base={settings.baseUrl} loginUrl={loginUrl}/>,
    system: <SystemCard resource={system} loginUrl={loginUrl}/>,
    warnings: <RecentWarnings resource={warnings} loginUrl={loginUrl}/>,
    streams: <Section title="Active streams" action={<button className="text-button" onClick={navigate}>View all <Icon name="arrow" size={16}/></button>}>
        <StreamList positions={positions} streams={visibleStreams.slice(0, 3)} open={open}/>
        {streams.data && !visibleStreams.length && <Empty title="All quiet here">{settings.showAllTransfers ? 'Active playback will appear here as soon as it starts.' : 'Streams appear after 64 KB transferred. Enable Show all transfers under More → Settings to include smaller requests.'}</Empty>}
      </Section>,
    providers: <Section title="Usenet health" action={<a className="text-button" href="#usenet">Providers <Icon name="arrow" size={16}/></a>}>
          <Status resource={usenet} loginUrl={loginUrl}/>
          <div className="card health-summary"><div className={`health-symbol ${issues ? 'orange' : 'green'}`}><Icon name="usenet" size={22}/></div><div><strong>{providers.length ? `${active} active · ${idle} idle${disabled ? ` · ${disabled} disabled` : ''}` : usenet.data ? 'No providers configured' : 'Waiting for providers'}</strong><p className={issues ? 'orange' : ''}>{issues ? `${issues} provider${issues === 1 ? '' : 's'} need attention` : providers.length ? active ? 'Providers are handling current activity.' : idle ? 'Providers idle · no fetches queued.' : 'No enabled providers.' : 'Provider connections appear once configured in AIOStreams.'}</p></div></div>
        </Section>,
    bandwidth: <Section title="Bandwidth" action={<a className="text-button" href="#history">History <Icon name="arrow" size={16}/></a>}>
          <div className="card chart-card"><div className="bandwidth-heading"><strong>{bytes(bandwidth.data?.periodTotal)}</strong><small>{bandwidth.data?.periodMode === 'monthly' ? 'Current accounting period' : 'Last 30 days'}{bandwidth.data?.globalLimit ? ` · of ${bytes(bandwidth.data.globalLimit)}` : ''}</small></div><Status resource={bandwidth} loginUrl={loginUrl}/><Chart points={bandwidth.data?.series.map(p => ({at: p.bucketMs, value: p.bytes})) ?? []} label="Data served"/></div>
        </Section>,
  };
  return <>
    <div className="intro overview-intro"><div><h1>Overview</h1><p>Your instance, at a glance</p></div><button className="text-button" aria-expanded={customizing} aria-controls="overview-customizer" onClick={() => setCustomizing(value => !value)}>{customizing ? 'Done' : 'Customize'}</button></div>
    {customizing && <><OverviewCustomizer layout={settings.overview} change={changeLayout}/>{layoutMessage && <p role="status" className="caption">{layoutMessage}</p>}{layoutError && <p role="alert" className="red">{layoutError}</p>}</>}
    <Status resource={streams} loginUrl={loginUrl}/>
    <Attention usenet={usenet} stats={stats} loginUrl={loginUrl} base={settings.baseUrl}/>
    <LiveActivity streams={streams} usenet={usenet} showAllTransfers={settings.showAllTransfers}/>
    {!shown.length && <p className="notice">All sections are hidden. Choose Customize to add them back.</p>}
    <div className="overview-content">{shown.map(section => <div key={section.id} data-overview-section={section.id} className={`overview-section ${section.id === 'streams' ? 'overview-streams' : ''}`}>
      {section.pinned && <span className="pinned-section">Pinned section</span>}{sections[section.id]}
    </div>)}</div>
  </>;
}
