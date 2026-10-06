import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, request, validSnapshot, endpoint } from '../api/client';
import { prepareMonitoring } from '../api/monitoring';
import { diagnose, diagnosticSource } from '../lib/diagnostics';
export interface Sample<T> { at: number; value: T }
export interface Resource<T> { data?: T; error?: ApiError; updatedAt?: number; loading: boolean; refreshing?: boolean; mode: 'connecting' | 'live' | 'polling' | 'disconnected' | 'background'; samples: Sample<T>[]; refresh: () => void }
export function useData<T>(base: string, path: string, seconds: number, enabled = true, live = false, points = 60, stopOn404 = false): Resource<T> {
  const [state, setState] = useState<Omit<Resource<T>, 'refresh'>>({ loading: true, mode: 'connecting', samples: [] });
  const refreshAction = useRef<() => void>(() => {});
  const refresh = useCallback(() => refreshAction.current(), []);
  useEffect(() => {
    const controller = new AbortController();
    let source: EventSource | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let authenticated = true;
    let fallbackActive = false;
    let lastSample = 0;
    let lastFrame = 0;
    let frameSequence = 0;
    let connectingAt = 0;
    const channel = diagnosticSource(path);
    const available = () => enabled && !controller.signal.aborted && !document.hidden && navigator.onLine && authenticated;
    setState({ loading: enabled, mode: 'connecting', samples: [] });
    const update = (incoming: T, mode: Resource<T>['mode']) => {
      if (controller.signal.aborted) return;
      const data = prepareMonitoring(path, incoming) as T;
      const at = Date.now();
      const sample = at - lastSample >= 2000;
      if (sample) lastSample = at;
      setState(previous => ({ data, loading: false, mode, updatedAt: at, samples: sample ? [...previous.samples, { at, value: data }].slice(-points) : previous.samples }));
    };
    const poll = async () => {
      if (!available() || inFlight) return;
      clearTimeout(timer);
      inFlight = true;
      setState(previous=>({...previous,refreshing:true}));
      const frameAtStart = frameSequence;
      try {
        const data = await request<T>(base, path, controller.signal);
        if (available() && frameSequence === frameAtStart) update(data, !live || source?.readyState === EventSource.OPEN ? 'live' : fallbackActive ? 'polling' : 'connecting');
      } catch (error) {
        if (!controller.signal.aborted && (frameSequence === frameAtStart || error instanceof ApiError && [401,403].includes(error.status))) {
          const apiError = error instanceof ApiError ? error : new ApiError('Unable to update monitoring data.');
          authenticated = ![401,403].includes(apiError.status) && !(stopOn404 && apiError.status===404);
          diagnose([401,403].includes(apiError.status) ? 'Authentication failure' : 'API response failure', channel, apiError.status);
          if (!authenticated) { source?.close(); source = undefined; clearTimeout(retry); }
          setState(previous => ({ ...previous, loading: false, error: apiError, mode: 'disconnected' }));
        }
      } finally {
        inFlight = false;
        if(!controller.signal.aborted)setState(previous=>previous.refreshing ? {...previous,refreshing:false} : previous);
        if (available() && (!live || !source || source.readyState !== EventSource.OPEN)) timer = setTimeout(() => void poll(), seconds * 1000);
      }
    };
    const fallback = (invalid = false) => {
      if (!available()) return;
      source?.close(); source = undefined;
      fallbackActive = true;
      diagnose(invalid ? 'Live frame rejected' : 'SSE disconnected', channel);
      diagnose('REST fallback entered', channel);
      setState(previous => ({ ...previous, mode: 'polling' }));
      clearTimeout(timer); void poll();
      clearTimeout(retry); retry = setTimeout(connect, 60000);
    };
    const connect = () => {
      if (!live || !available()) return;
      source?.close();
      connectingAt = Date.now();
      source = new EventSource(endpoint(base, `${path}/stream`), { withCredentials: true });
      source.onmessage = event => {
        if (!available()) return;
        try {
          const data: unknown = JSON.parse(event.data);
          if (!validSnapshot(path, data)) throw new Error('Incompatible SSE frame');
          if (!lastFrame || stateMode !== 'live') diagnose('SSE connected', channel);
          stateMode = 'live';
          fallbackActive = false;
          clearTimeout(timer); clearTimeout(retry);
          frameSequence++;
          lastFrame = Date.now();
          update(data as T, 'live');
        } catch { stateMode = 'polling'; fallback(true); }
      };
      source.onerror = () => { stateMode = 'polling'; fallback(); };
    };
    let stateMode: Resource<T>['mode'] = 'connecting';
    const resume = () => {
      clearTimeout(timer); clearTimeout(retry);
      source?.close(); source = undefined;
      lastFrame = 0; stateMode = 'connecting';fallbackActive=false;
      if (!available()) setState(previous => ({ ...previous, loading: false, mode: document.hidden ? 'background' : 'disconnected' }));
      else { void poll(); connect(); }
    };
    const manualRefresh = () => {
      if (!enabled || controller.signal.aborted) return;
      const wasUnauthorized = !authenticated;
      authenticated = true;
      void poll();
      if (wasUnauthorized) connect();
    };
    refreshAction.current = manualRefresh;
    // Streams are change-only SSE. Heartbeat comments do not trigger onmessage,
    // so an OPEN socket with an unchanged snapshot must remain live.
    const watchdog = enabled && live ? setInterval(() => {
      if (available() && source && source.readyState === EventSource.CONNECTING && Date.now() - connectingAt > 30000) { stateMode = 'polling'; fallback(); }
    }, 5000) : undefined;
    if (enabled) {
      resume();
      document.addEventListener('visibilitychange', resume);
      window.addEventListener('online', resume); window.addEventListener('offline', resume);
      window.addEventListener('aiomobile:refresh', manualRefresh);
    }
    return () => {
      controller.abort(); source?.close(); clearTimeout(timer); clearTimeout(retry); clearInterval(watchdog);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume); window.removeEventListener('offline', resume);
      window.removeEventListener('aiomobile:refresh', manualRefresh);
      refreshAction.current = () => {};
    };
  }, [base, path, seconds, enabled, live, points, stopOn404]);
  return useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
