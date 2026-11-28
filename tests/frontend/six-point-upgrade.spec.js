import {test,expect} from './fixtures.js';
test('explicit Stars ordering agrees with the table header inside a discipline',async({page})=>{
 await page.goto('./#discipline=science&sort=stars&view=table');
 await expect(page.locator('.ant-table-row').first()).toBeVisible();
 const stars=await page.locator('.table-stars').allTextContents();
 const numbers=stars.map(x=>Number(x.replaceAll(',','')));
 expect(numbers).toEqual([...numbers].sort((a,b)=>b-a));
 await expect(page.getByRole('button',{name:'按 Stars 排序',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('one scope entry retains independent common and related options',async({page})=>{
 await page.goto('./#discipline=science');
 const scope=page.getByRole('button',{name:/^收录范围/});
 await scope.click();
 const panel=page.getByRole('dialog',{name:'收录范围',exact:true});
 await panel.getByRole('switch',{name:'包含通用科研 Skills',exact:true}).click();
 await panel.getByRole('switch',{name:'含科研相关项目',exact:true}).click();
 await expect(page).toHaveURL(/common=0/);await expect(page).toHaveURL(/related=1/);
 await panel.getByRole('button',{name:'关闭',exact:true}).click();
 await expect(page.locator('.discipline-selector-foot .scope-switch')).toHaveCount(0);
});
for(const width of [1280,390,320])test(`brand, useful card and agent guides entry at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:950});
 await page.goto('./');
 await expect(page.locator('.brand')).toContainText('科研鼠鼠 · Skills 导航站');
 const guidesBtn=page.getByTestId('nav-agent-guides');
 await expect(guidesBtn).toBeVisible();
 await guidesBtn.click();
 const guide=page.getByTestId('agent-guides-module');
 await expect(guide).toContainText('Antigravity');await expect(guide).toContainText('Claude Code');
 await guide.getByTestId('guides-back-to-ranking').click();
 const card=page.getByTestId('repo-card').first();
 await expect(card.locator('[data-testid="card-updated"]')).toBeVisible();
 await expect(card.locator('[data-testid="card-tasks"]')).toBeVisible();
 await expect(card).not.toContainText('近 7 日 —');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('English brand fits cleanly on a narrow screen without redundant header ads',async({page})=>{
 await page.setViewportSize({width:320,height:900});
 await page.goto('./#lang=en');
 await expect(page.getByTestId('gpt-recharge-ad')).toHaveCount(0);
 const text=page.locator('.brand span').last();
 expect(await text.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const lang of ['zh','en'])test(`runtime document title keeps the ${lang} public brand`,async({page})=>{
 await page.goto(`./#lang=${lang}`);
 await expect(page.locator('.brand')).toBeVisible();
 await expect(page).toHaveTitle(lang==='zh'?'科研鼠鼠 · Skills 导航站｜大学生与研究生科研工具':'Research Hamster · Skills Directory');
});
