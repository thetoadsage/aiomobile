import mark from '../assets/brand-mark.json';

export function BrandMark() {
  return <svg className="brand-mark" viewBox={mark.viewBox} width={30} height={30} aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="14" fill="var(--background)"/>
    {mark.paths.map(path => <path key={path.d} d={path.d} fill="none" stroke="currentColor" strokeWidth={path.width} strokeLinecap="round"/>)}
  </svg>;
}
