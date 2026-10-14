import type { MediaTrack } from '../api/monitoringTypes';
export function trackDetails(track: MediaTrack): string {
  const hdr = track.hdr ? track.hdr : [track.dvProfile === undefined ? '' : `Dolby Vision P${track.dvProfile}`,track.hdr10Plus ? 'HDR10+' : track.colorTransfer === 'smpte2084' ? 'HDR10' : '',track.colorTransfer === 'arib-std-b67' ? 'HLG' : ''];
  return [track.language,track.title,track.profile,
    track.width && track.height ? `${track.width} × ${track.height}` : '',
    track.bitDepth ? `${track.bitDepth}-bit` : '',...hdr,
    track.avgFps || track.fps ? `${Number((track.avgFps || track.fps)!.toFixed(3))} fps` : '',
    track.channels ? `${track.channels} channels${track.channelLayout ? ` (${track.channelLayout})` : ''}` : track.channelLayout,
    track.sampleRate ? `${track.sampleRate / 1000} kHz` : '',track.bitrate ? `${(track.bitrate / 1000000).toFixed(2)} Mbps` : '',
    track.default ? 'Default' : '',track.forced ? 'Forced' : '',track.hearingImpaired ? 'Hearing impaired' : '',
    track.commentary ? 'Commentary' : '',track.original ? 'Original language' : '',track.dub ? 'Dub' : '',track.visualImpaired ? 'Audio description' : '',
  ].filter(Boolean).join(' · ') || 'No additional track details';
}
