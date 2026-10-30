import { expect, test } from 'vitest';
import { shareTiles } from '../src/lib/treemap';

test('tiles preserve shares and fill the plot without overlap for skewed and crowded data',()=>{
  for(const values of [[920,640,280,160],[100],[9999,1],Array.from({length:50},(_,i)=>i+1)]) {
    const tiles=shareTiles(values), total=values.reduce((a,b)=>a+b,0);
    for(const tile of tiles) {
      expect(tile.width*tile.height/10000).toBeCloseTo(values[tile.index]/total,10);
      expect(tile.x+tile.width).toBeLessThanOrEqual(100.00000001);
      expect(tile.y+tile.height).toBeLessThanOrEqual(100.00000001);
      for(const other of tiles.filter(other=>other.index>tile.index)) {
        const overlapX=Math.min(tile.x+tile.width,other.x+other.width)-Math.max(tile.x,other.x);
        const overlapY=Math.min(tile.y+tile.height,other.y+other.height)-Math.max(tile.y,other.y);
        expect(overlapX<1e-8 || overlapY<1e-8).toBe(true);
      }
    }
    expect(tiles.reduce((sum,tile)=>sum+tile.width*tile.height,0)).toBeCloseTo(10000,8);
  }
  expect(shareTiles([0,-1,NaN,Infinity])).toEqual([]);
});
