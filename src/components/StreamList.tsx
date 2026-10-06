import { useLayoutEffect, useRef } from 'react';
import type { LiveStreamSession } from '../api/types';
import { StreamCard } from './StreamCard';
export function StreamList({streams,open}:{streams:LiveStreamSession[];open:(id:string)=>void}) {
  const list=useRef<HTMLDivElement>(null);
  const positions=useRef(new Map<string,number>());
  const ids=JSON.stringify(streams.map(stream=>stream.id));
  useLayoutEffect(()=>{
    const root=list.current;
    if(!root || !ids)return;
    const origin=root.getBoundingClientRect().top;
    const next=new Map<string,number>();
    const animations:Animation[]=[];
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(root.closest('.reduced-motion'));
    for(const node of root.querySelectorAll<HTMLElement>('[data-stream-id]')) {
      const id=node.dataset.streamId!;
      const top=node.getBoundingClientRect().top-origin;
      next.set(id,top);
      const before=positions.current.get(id);
      if(!reduce && before!==undefined && Math.abs(before-top)>1 && node.animate)animations.push(node.animate([{transform:`translateY(${before-top}px)`},{transform:'translateY(0)'}],{duration:180,easing:'ease-out'}));
    }
    positions.current=next;
    return()=>animations.forEach(animation=>animation.cancel());
  },[ids]);
  return <div ref={list} className="stack">{streams.map(stream=><div data-stream-id={stream.id} key={stream.id}><StreamCard stream={stream} open={open}/></div>)}</div>;
}
