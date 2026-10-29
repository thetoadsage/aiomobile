import type { LiveStreams } from '../api/types';
import type { Resource } from '../hooks/useData';
import type { Settings } from '../lib/settings';
import { Empty, Status } from '../components/UI';
import { StreamList } from '../components/StreamList';
import { StreamHistory } from '../components/StreamHistory';

export function Streams({ resource, loginUrl, open, settings }: { resource: Resource<LiveStreams>; loginUrl: string; open: (id:string) => void; settings: Settings }) {
  const streams = resource.data?.streams;
  return <>
    <section aria-labelledby="active-streams-heading" className="current-streams">
      <div className="intro"><h1 id="active-streams-heading">Active streams</h1></div>
      <Status resource={resource} loginUrl={loginUrl}/>
      <StreamList streams={streams ?? []} open={open}/>
      {streams && !streams.length && <Empty title="No active streams"/>}
    </section>
    <StreamHistory settings={settings} loginUrl={loginUrl} activeIds={streams?.map(stream => stream.id) ?? []}/>
  </>;
}
