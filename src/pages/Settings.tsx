import { useRef, useState } from 'react';
import type { Settings as Preferences } from '../lib/settings';
import { normalizeBase, saveSettings } from '../lib/settings';
import { Diagnostics } from '../components/Diagnostics';
import { ThemePicker } from '../components/ThemePicker';
import type { ThemePreference } from '../lib/themes';
import { Section } from '../components/UI';
export function Settings({ settings, save }: { settings:Preferences; save:(value:Preferences)=>void }) {
  const advanced = useRef<HTMLDetailsElement>(null);
  const [draft,setDraft] = useState(settings);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const [themeMessage,setThemeMessage] = useState('');
  const [themeError,setThemeError] = useState('');
  const changeTheme = (theme: ThemePreference) => {
    setThemeMessage('');setThemeError('');
    try {
      const next = { ...settings, theme };
      saveSettings(next);save(next);
      setDraft(current => ({ ...current, theme }));
      setThemeMessage('Theme saved.');
    } catch { setThemeError('Could not save the theme. Check your browser storage settings and try again.'); }
  };
  return <><div className="intro"><h1>Settings</h1><p>Simple preferences. No secrets stored.</p></div><Section title="Appearance"><ThemePicker value={settings.theme} change={changeTheme}/>{themeError && <p role="alert" className="red">{themeError}</p>}{themeMessage && <p role="status" className="theme-status">{themeMessage}</p>}</Section><form onInvalidCapture={()=>{if(advanced.current)advanced.current.open=true;}} onSubmit={e=>{e.preventDefault();setError('');try{const next={...draft,baseUrl:normalizeBase(draft.baseUrl)};saveSettings(next);save(next);setDraft(next);setMessage('Preferences saved.');}catch(e){if(advanced.current)advanced.current.open=true;setError(e instanceof Error ? e.message : 'Unable to save preferences.');}}}><Section title="Display"><div className="card settings-card"><label className="toggle">Compact spacing<input type="checkbox" checked={draft.compact} onChange={e=>setDraft({...draft,compact:e.target.checked})}/></label><label className="toggle">Reduce motion<input type="checkbox" checked={draft.reducedMotion} onChange={e=>setDraft({...draft,reducedMotion:e.target.checked})}/></label></div></Section><details className="advanced-settings" ref={advanced}><summary><strong>Advanced settings</strong><small>Connection, refresh, and charts</small></summary><Section title="Connection"><div className="card settings-card"><label>AIOStreams base URL<input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="Same origin (recommended)" value={draft.baseUrl} onChange={e=>setDraft({...draft,baseUrl:e.target.value})}/></label><p className="caption">Leave blank when served at /mobile/ on your AIOStreams origin. The existing admin session cookie is sent automatically. A separate origin requires credentialed CORS and compatible cookie policy.</p><p className="caption">Sign in through the existing AIOStreams login. Passwords, API keys, and session tokens are never saved by AIOMobile.</p></div></Section><Section title="Refresh & charts"><div className="card settings-card"><label>REST fallback interval<select aria-label="REST fallback interval" value={draft.pollingSeconds} onChange={e=>setDraft({...draft,pollingSeconds:Number(e.target.value)})}>{[15,30,60].map(n=><option key={n} value={n}>{n} seconds</option>)}</select></label><label>Historical refresh<select aria-label="Historical refresh" value={draft.historySeconds} onChange={e=>setDraft({...draft,historySeconds:Number(e.target.value)})}><option value={30}>30 seconds</option><option value={60}>60 seconds</option></select></label><label>Live chart samples<select aria-label="Live chart samples" value={draft.chartPoints} onChange={e=>setDraft({...draft,chartPoints:Number(e.target.value)})}>{[30,60,120].map(n=><option key={n} value={n}>{n} samples</option>)}</select></label><p className="caption">SSE updates take priority. Live chart samples stay in memory and restart when you reopen the app.</p></div></Section></details>{error && <p role="alert" className="red">{error}</p>}{message && <p role="status" className="green">{message}</p>}<button className="primary full" type="submit">Save preferences</button></form><Diagnostics/><Section title="Add to your Home Screen"><div className="card install-card"><span className="app-icon">A</span><h3>AIOMobile, one tap away.</h3><p>Open this page in Safari on your iPhone. Tap Share, then Add to Home Screen. Enable Open as Web App if shown, then tap Add.</p><small>Requires HTTPS. The app shell works offline; monitoring needs a connection. If prompted after installing, sign in within the installed app.</small></div></Section></>;
}
