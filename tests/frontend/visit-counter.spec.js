import {test,expect} from './fixtures.js';
const site='https://riceai985.cc/';
for(const entry of ['', 'en/'])test(`footer has no public counter or Busuanzi requests at ${entry||'Chinese entry'}`,async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 await page.route('https://riceai985.cc/**',async route=>{
  const url=new URL(route.request().url());
  const response=await route.fetch({url:`http://127.0.0.1:4173${url.pathname}${url.search}`});
  await route.fulfill({response});
 });
 let requests=0;
 await page.route('https://busuanzi.9420.ltd/api',route=>{requests++;return route.fulfill({json:{success:true,data:{page_pv:100,page_uv:50}}});});
 await page.setViewportSize({width:390,height:900});await page.goto(site+entry);
 await expect(page.getByTestId('repo-card').first()).toBeVisible();
 await page.locator('.site-footer').scrollIntoViewIfNeeded();
 await expect(page.getByTestId('visit-counter')).toHaveCount(0);
 await expect(page.locator('.site-footer a[href*="busuanzi"]')).toHaveCount(0);
 await expect(page.locator('.site-footer a[href$="feed.xml"]')).toBeVisible();
 expect(requests).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
