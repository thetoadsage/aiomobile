import { ApiError, request } from '../api/client';
import type { LibrarySnapshot, LibraryStatus } from '../api/monitoringTypes';
import { useData } from '../hooks/useData';
import { count } from '../lib/format';
import type { Settings } from '../lib/settings';
import { Status } from './UI';

export const libraryStatuses = {
  available: 'Available', degraded: 'Degraded', failed: 'Failed',
  queued: 'Queued', inspecting: 'Inspecting', streaming: 'Streaming',
} satisfies Record<LibraryStatus, string>;
const statuses = Object.keys(libraryStatuses) as LibraryStatus[];
const countPath = '/usenet/library?limit=1';

async function loadCounts(base: string, path: string, signal?: AbortSignal) {
  const batch = new AbortController();
  const batchSignal = signal ? AbortSignal.any([signal, batch.signal]) : batch.signal;
  try {
    return await Promise.all(statuses.map(async status => {
      const { total, entries } = await request<LibrarySnapshot>(base, `${path}&statuses=${status}`, batchSignal);
      if (!Number.isSafeInteger(total) || entries.some(entry => entry.status !== status)) {
        throw new ApiError('AIOStreams returned incompatible library status counts.');
      }
      return { status, total };
    }));
  } finally {
    batch.abort();
  }
}

export function LibraryStatusStrip({ settings, loginUrl, selected, select }: {
  settings: Settings;
  loginUrl: string;
  selected: string;
  select: (status: LibraryStatus | '') => void;
}) {
  const resource = useData<Awaited<ReturnType<typeof loadCounts>>>(settings.baseUrl, countPath, Math.max(120, settings.historySeconds), true, false, 1, true, loadCounts);
  const groups = resource.data;
  const total = groups?.reduce((sum, group) => sum + group.total, 0) ?? 0;
  return <section className="card chart-card library-status-strip" aria-labelledby="library-status-heading">
    <div className="library-status-heading">
      <h2 id="library-status-heading">Release availability</h2>
      {groups && <span className="muted">{count(total)} releases</span>}
    </div>
    <Status resource={resource} loginUrl={loginUrl}/>
    {groups && <>
      {total > 0 && <div className="library-status-bar" aria-hidden="true" data-filtered={!!selected}>
        {groups.filter(group => group.total > 0).map(group => <span key={group.status} data-status={group.status} data-selected={group.status === selected} style={{ flexGrow: group.total }} onClick={() => select(group.status)}/>)}
      </div>}
      <div className="library-status-filters" role="group" aria-label="Filter releases by status">
        <button type="button" aria-pressed={!selected} onClick={() => select('')}>All statuses</button>
        {groups.map(group => <button type="button" key={group.status} data-status={group.status} aria-pressed={group.status === selected} onClick={() => select(group.status)}>
          <i aria-hidden="true"/>{libraryStatuses[group.status]} <strong>{count(group.total)}</strong>
        </button>)}
      </div>
      <p className="caption">Counts cover the whole library.</p>
    </>}
  </section>;
}
