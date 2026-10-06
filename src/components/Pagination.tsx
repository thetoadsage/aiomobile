export function Pagination({ offset, total, size=20, busy, capped=false, change }: { offset:number;total:number;size?:number;busy:boolean;capped?:boolean;change:(offset:number)=>void }) {
  return <div className="pagination"><button disabled={offset===0 || busy} onClick={()=>change(Math.max(0,offset-size))}>Previous</button><span>{total>offset ? `${offset+1}–${Math.min(offset+size,total)} of ${total.toLocaleString()}${capped ? '+' : ''}` : '0 results'}</span><button disabled={busy || offset+size>=total} onClick={()=>change(offset+size)}>Next</button></div>;
}
