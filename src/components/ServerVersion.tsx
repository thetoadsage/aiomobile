import { useEffect, useRef, useState } from 'react';
import { useData } from '../hooks/useData';
import { changelogUrl, checkReleases, comparableTag, releaseLink, releasesUrl, type ReleaseCheck, type ServerVersion as Version } from '../api/version';
import { date } from '../lib/format';
import { Section, Status, Facts, Empty } from './UI';

export function ServerVersion({ base, loginUrl }: {base:string;loginUrl:string}) {
  const resource = useData<Version>(base,'/status',300,true,false,1,true);
  const [check,setCheck] = useState<ReleaseCheck>();
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const controller = useRef<AbortController | undefined>(undefined);
  const status = resource.data;
  const tag = status && comparableTag(status);
  useEffect(() => {
    setCheck(undefined);setError('');setBusy(false);
    return () => controller.current?.abort();
  }, [base,status?.tag,status?.version,status?.channel]);
  async function checkUpdates() {
    if (!status || busy || document.hidden || !navigator.onLine) return;
    controller.current?.abort();
    const active = new AbortController();controller.current = active;
    setBusy(true);setError('');
    try { const result = await checkReleases(status,active.signal);if (!active.signal.aborted) setCheck(result); }
    catch(e) { if (!active.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to check releases. Try again.'); }
    finally { if (!active.signal.aborted) setBusy(false); }
  }
  const buildTime = status?.buildTime ? Date.parse(status.buildTime) : NaN;
  return <Section title="AIOStreams version">
    {resource.error?.status === 404 ? <Empty title="Version information unavailable">This instance does not expose version information.<button onClick={resource.refresh}>Check again</button></Empty> : <Status resource={resource} loginUrl={loginUrl}/>}
    {status && <div className="card server-version">
      <div className="version-heading"><strong>{tag ? <a href={releaseLink(tag)} target="_blank" rel="noopener noreferrer">{tag}</a> : status.tag || status.version}</strong><small>{status.channel === 'nightly' ? 'Nightly' : status.channel === 'dev' ? 'Development' : status.channel === 'stable' ? 'Stable' : 'Channel unavailable'}</small></div>
      <p className={check?.newer ? 'orange' : 'caption'} role="status">{busy ? 'Checking GitHub releases…' : error ? 'Update check unavailable' : !check ? 'Updates have not been checked.' : check.newer ? `${check.complete ? '' : 'At least '}${check.newer} newer ${status.channel === 'nightly' ? 'build' : 'release'}${check.newer === 1 ? '' : 's'} available` : check.complete && check.latest ? 'Up to date with published releases.' : check.complete ? 'No published releases found for this channel.' : 'No newer version found in the fetched page; the release list is incomplete.'}</p>
      {error && <p className="orange" role="alert">{error}</p>}
      <details className="secondary-facts"><summary>Build &amp; updates</summary><Facts items={[
        ['Version',status.version],['Built',Number.isNaN(buildTime) ? 'Unavailable' : date(buildTime)],
        ['Commit',status.commit && /^[a-f0-9]{7,40}$/i.test(status.commit) ? <a href={`https://github.com/Viren070/AIOStreams/commit/${status.commit}`} target="_blank" rel="noopener noreferrer">{status.commit.slice(0,12)}</a> : 'Unavailable'],
        ['Latest fetched',check?.latest ? <a href={releaseLink(check.latest)} target="_blank" rel="noopener noreferrer">{check.latest}</a> : 'Not available'],
        ['Last checked',check ? date(check.checkedAt) : 'Not checked'],
      ]}/><p className="caption">{tag ? 'Checks GitHub for this channel without sending instance details. Fetches one page of up to 100 releases.' : 'Update comparison is unavailable for this build.'}</p>
      {tag && <button disabled={busy || !!resource.error} onClick={()=>void checkUpdates()}>{busy ? 'Checking…' : 'Check for updates'}</button>}
      <div className="version-links"><a href={changelogUrl} target="_blank" rel="noopener noreferrer">Changelog</a><a href={releasesUrl} target="_blank" rel="noopener noreferrer">All releases</a></div>
      </details>
    </div>}
  </Section>;
}
