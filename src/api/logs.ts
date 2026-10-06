import { ApiError, endpoint } from './client';
import type { LogQuery } from './logTypes';
import { logQuery, safeLogLine } from '../lib/logs';
export function logExportUrl(base: string, filters: LogQuery, format: 'log' | 'json') {
  return `${endpoint(base,'/logs/export')}?${logQuery(filters)}&format=${format}`;
}
// Use the upstream export payload, masking its lines before downloading. Neither format is a JSON array.
export async function downloadLogs(base: string, filters: LogQuery, format: 'log' | 'json', signal: AbortSignal) {
  const response=await fetch(logExportUrl(base,filters,format),{credentials:'include',cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(60000)])});
  if([401,403].includes(response.status) || response.redirected && new URL(response.url).pathname==='/login') throw new ApiError('Sign in to AIOStreams to export logs.',response.status===403 ? 403 : 401);
  if(!response.ok || !response.headers.get('content-type')?.match(/text\/plain|application\/x-ndjson/)) throw new ApiError('Unable to export logs. Check the connection and API route.',response.status);
  const reader=response.body?.getReader(); if(!reader) throw new ApiError('The export response was empty.');
  const chunks: Uint8Array[]=[]; let size=0;
  try {
    for(;;) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>20*1024*1024) { await reader.cancel(); throw new ApiError('Export exceeds the mobile 20 MB limit. Narrow the filters and try again.'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const decoder=new TextDecoder(); const text=chunks.map(chunk=>decoder.decode(chunk,{stream:true})).join('')+decoder.decode();
  const sanitized=text.split('\n').map(line=>line ? safeLogLine(line) : '').join('\n');
  const blob=new Blob([sanitized],{type:format==='json' ? 'application/x-ndjson' : 'text/plain'});
  const url=URL.createObjectURL(blob); const link=document.createElement('a');link.href=url;link.download=`aiostreams-${new Date().toISOString().replace(/[:.]/g,'-')}.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
