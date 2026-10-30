export interface ShareTile { index: number; x: number; y: number; width: number; height: number }
/** Balanced binary partition; every tile's area equals its fraction of the total. */
export function shareTiles(values: number[]): ShareTile[] {
  const tiles: ShareTile[] = [];
  const rows = values.map((value,index)=>({value,index})).filter(row=>Number.isFinite(row.value) && row.value>0);
  function split(items: typeof rows, x: number, y: number, width: number, height: number) {
    if (!items.length) return;
    if (items.length === 1) { tiles.push({index:items[0].index,x,y,width,height}); return; }
    const total=items.reduce((sum,row)=>sum+row.value,0);
    let cut=1, sum=items[0].value;
    while(cut<items.length-1 && Math.abs(sum+items[cut].value-total/2)<Math.abs(sum-total/2)) sum+=items[cut++].value;
    const fraction=sum/total;
    if(width>=height) {
      split(items.slice(0,cut),x,y,width*fraction,height);
      split(items.slice(cut),x+width*fraction,y,width*(1-fraction),height);
    } else {
      split(items.slice(0,cut),x,y,width,height*fraction);
      split(items.slice(cut),x,y+height*fraction,width,height*(1-fraction));
    }
  }
  split(rows,0,0,100,100);
  return tiles;
}
