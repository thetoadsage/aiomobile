import { test, expect } from '@playwright/test';
import { liveStreams } from '../fixtures';

test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

for (const feed of ['SSE','REST']) {
  test(`${feed} file position follows range offsets on cards and details`, async ({ page }) => {
    let data = {...liveStreams,streams:[{...liveStreams.streams[0],size:1000,start:300,currentBytes:100,bytesServed:5000}]};
    await page.route('**/streams/live', route => route.fulfill({json:{success:true,data}}));
    if (feed === 'REST') await page.route('**/live/stream', route => route.abort());
    else await page.addInitScript(() => {
      const Native = window.EventSource;
      class StreamSource {
        static OPEN=1;
        static CONNECTING=0;
        static CLOSED=2;
        readyState=1;
        onmessage: ((event:MessageEvent) => void) | null=null;
        onerror: (() => void) | null=null;
        constructor() { window.addEventListener('fixture:stream-frame',this.frame); }
        frame=(event:Event) => this.onmessage?.(new MessageEvent('message',{data:JSON.stringify((event as CustomEvent).detail)}));
        close() { this.readyState=2;window.removeEventListener('fixture:stream-frame',this.frame); }
      }
      const Source = function(url:string|URL,options?:EventSourceInit) {
        return String(url).includes('/streams/live/stream') ? new StreamSource() : new Native(url,options);
      };
      Object.assign(Source,{OPEN:1,CONNECTING:0,CLOSED:2});
      Object.defineProperty(window,'EventSource',{value:Source,configurable:true});
    });
    await page.goto('/mobile/#streams');
    const card=page.locator('.stream-card');
    const position=card.locator('.stream-position strong');
    await expect(position).toHaveText('40%');
    const update=async (values:Partial<typeof data.streams[number]>) => {
      data={...data,streams:[{...data.streams[0],...values}]};
      if(feed==='SSE') await page.evaluate(frame=>window.dispatchEvent(new CustomEvent('fixture:stream-frame',{detail:frame})),data);
      else await page.getByRole('button',{name:'Refresh dashboard'}).click();
    };
    await update({start:400,currentBytes:0,requests:13});
    await expect(position).toHaveText('40%');
    expect(await card.locator('.progress > div').evaluate(el=>(el as HTMLElement).style.width)).toBe('40%');
    await update({currentBytes:100});
    await expect(position).toHaveText('50%');
    await card.click();
    const detail=page.locator('.facts > div').filter({has:page.locator('dt',{hasText:'File position'})}).locator('dd');
    await expect(detail).toHaveText('50.0%');
    await update({activeReads:0,start:0,currentBytes:0});
    await expect(detail).toHaveText('Unavailable');
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await expect(position).toHaveText('Unavailable');
    await expect(card.locator('.progress')).toBeHidden();
    await update({activeReads:1,activity:'paused',start:100,currentBytes:0});
    await expect(position).toHaveText('10%');
    await expect(card.locator('.progress')).toBeVisible();
    await update({activity:'streaming',start:0,currentBytes:0});
    await expect(position).toHaveText('0%');
    await update({size:0});
    await expect(position).toHaveText('Size unknown');
    await expect(card.locator('.progress')).toBeHidden();
  });
}
