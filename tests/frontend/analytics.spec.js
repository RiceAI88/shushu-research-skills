import {test,expect} from './fixtures.js';
const site='https://riceai985.cc/';
const tracker='https://cloud.umami.is/script.js';
async function productionPage(page,{automated=false}={}) {
 if(!automated)await page.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 await page.route('https://riceai985.cc/**',async route=>{
  const url=new URL(route.request().url());
  const response=await route.fetch({url:`http://127.0.0.1:4173${url.pathname}${url.search}`});
  await route.fulfill({response});
 });
 await page.route('https://busuanzi.9420.ltd/api',route=>route.abort());
}
const mockTracker=`window.__analytics=[];window.umami={track(build){window.__analytics.push(build({website:document.querySelector('[data-website-id]').dataset.websiteId,url:location.pathname+location.search,title:document.title,referrer:document.referrer}));return Promise.resolve();}};`;
for(const entry of ['', 'en/'])test(`Umami records one incoming channel and ignores hash navigation at ${entry||'Chinese entry'}`,async({page})=>{
 await productionPage(page);
 await page.route(tracker,route=>route.fulfill({contentType:'application/javascript',body:mockTracker}));
 await page.goto(site+entry+'?utm_source=douyin&utm_medium=video&utm_campaign=skills_nav#view=card');
 await expect.poll(()=>page.evaluate(()=>window.__analytics?.length)).toBe(1);
 const script=page.locator('script[src="'+tracker+'"]');
 await expect(script).toHaveAttribute('data-website-id','f9eb8025-865b-4ddb-b00e-510bb13e56f5');
 await expect(script).toHaveAttribute('data-auto-track','false');
 await page.getByRole('searchbox').fill('paper');await page.locator('.nav-actions').getByText(entry?'中文':'EN',{exact:true}).click();
 expect(await page.evaluate(()=>window.__analytics.length)).toBe(1);
 const payload=await page.evaluate(()=>window.__analytics[0]);
 expect(payload.url).toBe('/'+entry+'?utm_source=douyin&utm_medium=video&utm_campaign=skills_nav');
 expect(payload.url).not.toContain('#');
});
test('late tracker preserves the original campaign and failure leaves the ranking usable',async({page})=>{
 await productionPage(page);let release;const gate=new Promise(resolve=>release=resolve);
 await page.route(tracker,async route=>{await gate;await route.fulfill({contentType:'application/javascript',body:mockTracker});});
 try {
  await page.goto(site+'?utm_source=wechat&utm_medium=group',{waitUntil:'domcontentloaded'});
  await expect(page.getByTestId('repo-card').first()).toBeVisible();
  await page.getByRole('searchbox').fill('paper');release();
  await expect.poll(()=>page.evaluate(()=>window.__analytics?.length)).toBe(1);
  expect((await page.evaluate(()=>window.__analytics[0])).url).toBe('/?utm_source=wechat&utm_medium=group');
 } finally {release();}
 await page.route(tracker,route=>route.abort());await page.reload();
 await expect(page.getByTestId('repo-card').first()).toBeVisible();await page.getByRole('searchbox').fill('zotero');
 await expect(page).toHaveURL(/q=zotero/);
});
test('local previews and automated production visits never load the tracker',async({page})=>{
 let requests=0;await page.route(tracker,route=>{requests++;return route.abort();});
 await page.goto('./');await expect(page.getByTestId('repo-card').first()).toBeVisible();expect(requests).toBe(0);
 await productionPage(page,{automated:true});await page.goto(site);await expect(page.getByTestId('repo-card').first()).toBeVisible();expect(requests).toBe(0);
});
