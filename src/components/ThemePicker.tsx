import { Icon } from './Icon';
import { themes, type ThemePreference } from '../lib/themes';
export function ThemePicker({ value, change }: { value: ThemePreference; change: (theme: ThemePreference) => void }) {
  return <fieldset className="theme-picker"><legend>Color theme</legend><p className="caption">Applies immediately and saves on this device.</p><div className="theme-options">
    {themes.map(theme => <label className="theme-choice" key={theme.id}>
      <input type="radio" name="theme" value={theme.id} checked={value === theme.id} onChange={() => change(theme.id)}/>
      <span className="theme-preview" data-theme={theme.id} aria-hidden="true"><span className="theme-preview-bar"/><span className="theme-preview-body"><span/><span/><span/></span></span>
      <span className="theme-choice-title">{theme.name}<span aria-hidden="true" className="theme-check"><Icon name="check" size={16}/></span></span><small>{theme.description}</small>
    </label>)}
    <label className="theme-choice theme-system"><input type="radio" name="theme" value="system" checked={value === 'system'} onChange={() => change('system')}/><span className="theme-system-symbol" aria-hidden="true"><Icon name="appearance" size={24}/></span><span className="theme-choice-title">Use device appearance<span aria-hidden="true" className="theme-check"><Icon name="check" size={16}/></span></span><small>Follows light and dark mode</small></label>
  </div></fieldset>;
}
