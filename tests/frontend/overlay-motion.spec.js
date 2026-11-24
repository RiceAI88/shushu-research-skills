import {test,expect} from './fixtures.js';

async function exitState(panel,button) {
 await panel.evaluate(async el=>{await Promise.allSettled(el.getAnimations({subtree:true}).map(a=>a.finished));});
 return panel.evaluate(async(el,selector)=>{
  el.querySelector(selector).click();
  for(let i=0;i<10;i++){
   await new Promise(resolve=>requestAnimationFrame(resolve));
   if(el.getAnimations({subtree:true}).some(a=>a.playState==='running'))break;
  }
  return {display:getComputedStyle(el).display,running:el.getAnimations({subtree:true}).some(a=>a.playState==='running')};
 },button);
}

test.describe('entry promotion transition',()=>{
 test.use({showEntryNotice:true});
 test('notice remains rendered during exit and settles fully hidden',async({page})=>{
  await page.goto('./');
  const panel=page.locator('.recharge-modal .ant-modal');await expect(panel).toBeVisible();
  const exit=await exitState(panel,'.recharge-notice-close');
  expect(exit).toEqual({display:'inline-block',running:true});
  await expect(panel).not.toBeVisible();
 });
});

test('slow guide opens one modal shell with a skeleton, permits closing, then loads in place',async({page})=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/BeginnerGuide-*.js',async route=>{await gate;await route.continue();});
 try {
  await page.goto('./');await page.getByRole('button',{name:'30 秒看懂 Skill',exact:true}).click();
  const panel=page.getByRole('dialog',{name:'科研 Skills 入门',exact:true});
  await expect(panel).toBeVisible();await expect(panel.locator('.ant-skeleton')).not.toHaveCount(0);await expect(panel.locator('[aria-busy="true"]')).toBeVisible();
  await panel.evaluate(el=>{el.dataset.stableShell='yes';});
  await panel.getByRole('button',{name:'关闭入门指南',exact:true}).click();
  await expect(panel).not.toBeVisible();
  release();
  await page.getByRole('button',{name:'30 秒看懂 Skill',exact:true}).click();
  await expect(panel).toHaveAttribute('data-stable-shell','yes');
  await expect(panel).toContainText('先准备哪些工具');
  await expect(panel.locator('[aria-busy="true"]')).toHaveCount(0);
  expect(await exitState(panel,'.ant-modal-close')).toEqual({display:'inline-block',running:true});
  await expect(panel).not.toBeVisible();
 } finally {release();}
});

for(const width of [1440,390])test(`filter loads with a skeleton and transitions both ways at ${width}px`,async({page})=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/FilterControls-*.js',async route=>{await gate;await route.continue();});
 try {
  await page.setViewportSize({width,height:950});await page.goto('./');
  const trigger=page.getByRole('button',{name:'筛选',exact:true});await trigger.click();
  const panel=page.getByRole('dialog',{name:'筛选条件',exact:true});
  await expect(panel.locator('[aria-busy="true"]')).toBeVisible();
  await expect(panel.locator('.ant-skeleton')).not.toHaveCount(0);
  release();await expect(panel.getByRole('combobox').first()).toBeVisible();
  const surface=page.locator(width>760?'.ant-popover.filter-overlay':'.ant-drawer.filter-overlay');
  await expect(surface).toBeVisible();
  const exit=await exitState(surface,width>760?'.popover-panel-heading button':'.ant-drawer-close');
  expect(exit.running).toBe(true);expect(exit.display).not.toBe('none');
  await expect(panel).not.toBeVisible();await expect(trigger).toBeFocused();
  await trigger.click();await expect(panel.getByRole('combobox').first()).toBeVisible();
  await page.keyboard.press('Escape');await expect(panel).not.toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 } finally {release();}
});

test('reduced motion removes modal and panel movement and skeleton shimmer',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');
 await page.getByRole('button',{name:'30 秒看懂 Skill',exact:true}).click();
 const guide=page.getByRole('dialog',{name:'科研 Skills 入门',exact:true});
 await expect(guide).toBeVisible();expect(await guide.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
 await guide.getByRole('button',{name:'关闭入门指南',exact:true}).click();await expect(guide).not.toBeVisible();
 await page.getByRole('button',{name:'筛选',exact:true}).click();
 expect(await page.getByRole('dialog',{name:'筛选条件',exact:true}).evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
});

test('slow detail drawer opens shell immediately with repo title and skeleton, permits closing, then loads in place',async({page})=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/RepositoryDrawer-*.js',async route=>{await gate;await route.continue();});
 try {
  await page.goto('./');
  await page.getByTestId('repo-card').first().click();
  const drawer=page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('.drawer-repo')).not.toBeEmpty();
  await expect(drawer.locator('.overlay-skeleton-drawer[aria-busy="true"]')).toBeVisible();
  await expect(drawer.locator('.ant-skeleton')).not.toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  release();
  await page.getByTestId('repo-card').first().click();
  await expect(drawer).toBeVisible();
  await expect(drawer.locator('.drawer-content')).toBeVisible();
  await expect(drawer.locator('[aria-busy="true"]')).toHaveCount(0);
 } finally {release();}
});
