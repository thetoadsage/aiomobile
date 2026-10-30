import { test, expect } from '@playwright/test';
import { liveStreams } from '../fixtures';

test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

for (const feed of ['SSE','REST']) {
  test(`${feed} furthest position holds between reads and across navigation, advancing only on higher observations`, async ({ page }, testInfo) => {
    let data = {...liveStreams,streams:[{...liveStreams.streams[0],size:1000,start:300,currentBytes:100,bytesServed:5_000_000}]};
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
      else await Promise.all([page.waitForResponse(response=>response.url().endsWith('/streams/live')),page.getByRole('button',{name:'Refresh dashboard'}).click()]);
    };
    await update({start:400,currentBytes:0,requests:13});
    await expect(position).toHaveText('40%');
    expect(await card.locator('.progress > div').evaluate(el=>(el as HTMLElement).style.width)).toBe('40%');
    await update({currentBytes:100});
    await expect(position).toHaveText('50%');
    await card.click();
    const detail=page.locator('.facts > div').filter({has:page.locator('dt',{hasText:'Furthest file position'})}).locator('dd');
    await expect(detail).toHaveText('50.0%');
    await update({activeReads:0,start:0,currentBytes:0});
    await expect(detail).toHaveText('50.0%');
    if (feed === 'SSE' && testInfo.project.name === 'webkit') {
      for (const [width, theme] of [[320,'sage'],[390,'paper'],[1280,'sage']] as const) {
        await page.setViewportSize({width,height:844});
        await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme==='paper'?'light':'dark';},theme);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await page.screenshot({path:`.impeccable/review/furthest-position/${width}-${theme}-detail.png`,fullPage:true,scale:'css'});
      }
      await page.setViewportSize({width:390,height:844});
    }
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await expect(position).toHaveText('50%');
    await expect(card.locator('.progress')).toBeVisible();
    await update({activeReads:1,activity:'paused',start:100,currentBytes:0});
    await expect(position).toHaveText('50%');
    await update({activity:'streaming',start:600,currentBytes:60});
    await expect(position).toHaveText('66%');
    await update({activeReads:0,start:0,currentBytes:0});
    await expect(position).toHaveText('66%');
    await page.getByRole('link',{name:'Overview',exact:true}).click();
    await expect(position).toHaveText('66%');
    await page.getByRole('link',{name:'More',exact:true}).click();
    await page.getByRole('link',{name:'Streams',exact:true}).click();
    await expect(position).toHaveText('66%');
    await card.click(); await expect(detail).toHaveText('66.0%');
    await expect(page.getByText('Furthest file position is the highest percentage observed during this visit.',{exact:false})).toBeVisible();
    await page.getByRole('button',{name:'Back',exact:true}).click();
    await update({start:100,currentBytes:0,activeReads:1});
    await expect(position).toHaveText('66%');
    await update({start:700,currentBytes:0});
    await expect(position).toHaveText('70%');
    await update({activeReads:0,start:0,currentBytes:0});
    await expect(position).toHaveText('70%');
    await page.reload();
    await expect(position).toHaveText('Unavailable');
    await expect(card.locator('.progress')).toBeHidden();
    await update({activeReads:1,start:0,currentBytes:0});
    await expect(position).toHaveText('0%');
    await update({activeReads:0});
    await expect(position).toHaveText('0%');
    await update({startedAt:data.streams[0].startedAt+1,size:0});
    await expect(position).toHaveText('Size unknown');
    await expect(card.locator('.progress')).toBeHidden();
    await update({size:1000});
    await expect(position).toHaveText('Unavailable');
    await update({bytesServed:65535});
    await expect(card).toHaveCount(0);
    await update({bytesServed:65536});
    await expect(card).toHaveCount(1);
  });
}
