import { describe, expect, it } from 'vitest';
import { recordedSelection, recordedSeries } from '../src/lib/recordedChart';

describe('recorded history accumulation', () => {
  it('sums sparse records without turning missing buckets into measured zeros', () => {
    const series = recordedSeries([{at:0,value:10},{at:3000,value:20},{at:4000,value:0}],1000,0,5500);
    expect(series.total).toBe(30);
    expect(series.buckets.map(point => point.total)).toEqual([10,30,30]);
    expect(recordedSelection(series,2)).toMatchObject({value:undefined,total:10});
    expect(recordedSelection(series,4)).toMatchObject({value:0,total:30});
    expect(recordedSelection(series,5)).toMatchObject({end:5500,value:undefined,total:30});
  });
  it('keeps partial boundary buckets, merges duplicates and excludes invalid or out-of-window values', () => {
    const series = recordedSeries([{at:1000,value:2},{at:1000,value:3},{at:0,value:99},{at:4001,value:99},{at:2000,value:-1},{at:2000,value:NaN}],1000,1500,4000);
    expect(series.start).toBe(1000);
    expect(series.total).toBe(5);
    expect(series.buckets).toEqual([{at:1000,end:2000,value:5,total:5}]);
  });
  it('handles empty, zero and one recorded bucket without inventing samples', () => {
    expect(recordedSeries([],1000,0,5000).buckets).toEqual([]);
    const series = recordedSeries([{at:2000,value:0}],1000,0,5000);
    expect(series.buckets).toHaveLength(1);
    expect(recordedSelection(series,2).value).toBe(0);
    expect(recordedSelection(series,0).value).toBeUndefined();
  });
});
