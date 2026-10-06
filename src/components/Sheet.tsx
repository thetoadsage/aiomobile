import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
export function Sheet({title,close,children,busy=false}:{title:string;close:()=>void;children:ReactNode;busy?:boolean}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=dialog.current;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';el?.showModal();return()=>{el?.close();document.body.style.overflow=overflow;};},[]);
  return <dialog ref={dialog} className="log-sheet card" aria-label={title} aria-busy={busy} onCancel={e=>{e.preventDefault();if(!busy)close();}} onClick={e=>{if(e.target===dialog.current && !busy)close();}}><div className="sheet-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close sheet" disabled={busy} onClick={close}><Icon name="close"/></button></div>{children}</dialog>;
}
