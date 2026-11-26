import { test, expect } from "./fixtures.js";

test("empty search shows guidance near the filters without promotions", async ({ page }) => {
  await page.goto("./#q=zzzqqq-no-match");
  const empty = page.getByTestId("ranking-empty");
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("没有找到与「zzzqqq-no-match」相关的项目");
  await expect(page.getByTestId("zhi1ke-ad")).toHaveCount(0);
  await expect(page.getByTestId("daily-arrivals")).toHaveCount(0);
  // Guidance must start inside the first viewport on desktop.
  const box = await empty.boundingBox();
  expect(box.y).toBeLessThan(1000);
  const keyword = empty.locator("[data-empty-keyword]").first();
  await expect(keyword).toBeVisible();
  const word = await keyword.getAttribute("data-empty-keyword");
  await keyword.click();
  await expect(page.getByRole("searchbox").first()).toHaveValue(word);
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
});

test("empty state offers to keep only the search term when other filters block results", async ({ page }) => {
  await page.goto("./#q=Zotero&fav=1");
  const empty = page.getByTestId("ranking-empty");
  await expect(empty).toContainText("没有找到与「Zotero」相关的项目");
  const keep = empty.locator('[data-empty-action="keep-query"]');
  await expect(keep).toBeVisible();
  await keep.click();
  await expect(page).not.toHaveURL(/fav=1/);
  await expect(page).toHaveURL(/q=Zotero/);
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
});

test("clear-all action restores the full ranking", async ({ page }) => {
  await page.goto("./#q=zzzqqq-no-match");
  await page.getByTestId("ranking-empty").locator('[data-empty-action="clear-all"]').click();
  await expect(page.getByTestId("ranking-empty")).toHaveCount(0);
  await expect(page.getByRole("searchbox").first()).toHaveValue("");
  await expect(page.getByTestId("daily-arrivals")).toBeVisible();
});

test("empty search aligns filter bar and count pills, and hands natural-language query to Shushu AI", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("https://bot.riceai985.cc/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "推荐 **blader/humanizer** 搭配 **Gostyan/docx-skill-4-cn-paper** 优化学术表达。",
        provider: "zhipu-glm-4-flash",
      }),
    }),
  );

  await page.goto("./#q=" + encodeURIComponent("本科生不会代码怎么降 AIGC 率"));
  const empty = page.getByTestId("ranking-empty");
  await expect(empty).toBeVisible();

  // 验证当前筛选栏左边缘与下方榜单头部严格左对齐，且关键词胶囊内文字与数字垂直居中对齐
  const alignment = await page.evaluate(() => {
    const filterLeft = document
      .querySelector('[data-testid="active-filters"]')
      .getBoundingClientRect().left;
    const headerLeft = document
      .querySelector(".ranking-header")
      .getBoundingClientRect().left;
    const pill = document.querySelector(".ranking-empty-keyword-pill");
    const [label, count] = pill.querySelectorAll("span");
    const lb = label.getBoundingClientRect();
    const cb = count.getBoundingClientRect();
    return {
      leftDiff: Math.abs(filterLeft - headerLeft),
      centerDiff: Math.abs(lb.top + lb.height / 2 - (cb.top + cb.height / 2)),
    };
  });
  expect(alignment.leftDiff).toBeLessThanOrEqual(1);
  expect(alignment.centerDiff).toBeLessThanOrEqual(1.5);

  // 点击一键问鼠鼠，自动带入原搜索语句并获取推荐
  await empty.getByTestId("empty-ask-shushu").click();
  const panel = page.getByTestId("shushu-bot-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(/\d{3}\+\s*真实收录库/);
  await expect(panel.getByTestId("shushu-msg-user")).toContainText(
    "本科生不会代码怎么降 AIGC 率",
  );
  await expect(panel.getByTestId("shushu-msg-assistant")).toContainText(
    "humanizer",
  );
});
