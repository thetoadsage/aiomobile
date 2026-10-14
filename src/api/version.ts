export interface ServerVersion {
  version: string;
  tag?: string;
  channel?: 'stable' | 'nightly' | 'dev';
  commit?: string;
  buildTime?: string;
}

export const releasesUrl = 'https://github.com/Viren070/AIOStreams/releases';
export const changelogUrl = 'https://docs.aiostreams.viren070.me/changelog/';
const releasesApi = 'https://api.github.com/repos/Viren070/AIOStreams/releases?per_page=100&page=1';
const stable = /^v?\d+\.\d+\.\d+$/;
const nightly = /^\d{4}\.\d{2}\.\d{2}\.\d{4}-nightly$/;
export function comparableTag(status: ServerVersion): string | undefined {
  const tag = status.tag || status.version;
  return status.channel === 'nightly' ? nightly.test(tag) ? tag : undefined
    : status.channel !== 'dev' && stable.test(tag) ? tag : undefined;
}
function compare(a: string, b: string, channel: ServerVersion['channel']) {
  if (channel === 'nightly') return a.localeCompare(b);
  const av = a.replace(/^v/, '').split('.').map(Number);
  const bv = b.replace(/^v/, '').split('.').map(Number);
  return av[0] - bv[0] || av[1] - bv[1] || av[2] - bv[2];
}
export interface ReleaseCheck {
  latest?: string;
  newer: number;
  complete: boolean;
  checkedAt: number;
}
export function compareReleases(status: ServerVersion, data: unknown, hasMore: boolean): ReleaseCheck {
  const running = comparableTag(status);
  if (!running) throw new Error('This build cannot be compared with published releases.');
  if (!Array.isArray(data) || !data.every(r => r && typeof r.tag_name === 'string' && typeof r.draft === 'boolean' && typeof r.prerelease === 'boolean')) throw new Error('GitHub returned an unexpected release list.');
  const pattern = status.channel === 'nightly' ? nightly : stable;
  const tags = [...new Set<string>(data.filter(r => !r.draft && (status.channel === 'nightly' || !r.prerelease) && pattern.test(r.tag_name)).map(r => r.tag_name))].sort((a,b) => compare(b,a,status.channel));
  const newer = tags.filter(tag => compare(tag,running,status.channel) > 0).length;
  // An unexhausted mixed-channel page only establishes a lower bound.
  return {latest:tags[0],newer,complete:!hasMore && data.length < 100,checkedAt:Date.now()};
}
export async function checkReleases(status: ServerVersion, signal: AbortSignal): Promise<ReleaseCheck> {
  const response = await fetch(releasesApi, {credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});
  if (!response.ok) throw new Error([403,429].includes(response.status) ? 'GitHub could not check releases. Its rate limit may have been reached; try again later.' : `GitHub could not check releases (HTTP ${response.status}).`);
  return compareReleases(status,await response.json(),!!response.headers.get('link')?.includes('rel="next"'));
}
export function releaseLink(tag: string) { return `${releasesUrl}/tag/${encodeURIComponent(tag)}`; }
