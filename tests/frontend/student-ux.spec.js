import { test, expect } from "./fixtures.js";

test("stage quick-picks, shared toolkit pack banner, and zero-CLI Web AI guide work end to end", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./");

  // 1. 论文阶段急救包对齐与筛选
  const stageBar = page.getByTestId("stage-quick-bar");
  await expect(stageBar).toBeVisible();
  const stageAlignment = await page.evaluate(() => {
    const discLabel = document
      .querySelector(".discipline-row-label")
      .getBoundingClientRect();
    const stageLabel = document
      .querySelector(".stage-quick-label")
      .getBoundingClientRect();
    const firstPill = document
      .querySelector(".stage-pill")
      .getBoundingClientRect();
    return {
      leftDelta: Math.abs(discLabel.left - stageLabel.left),
      centerYDelta: Math.abs(
        stageLabel.top +
          stageLabel.height / 2 -
          (firstPill.top + firstPill.height / 2),
      ),
    };
  });
  expect(stageAlignment.leftDelta).toBeLessThan(1);
  expect(stageAlignment.centerYDelta).toBeLessThan(1);
  await stageBar.locator('[data-stage="slides"]').click();
  await expect(page).toHaveURL(/#.*stage=slides/);
  await expect(page.getByTestId("stage-quick-hint")).toBeVisible();
  await expect(page.getByTestId("repo-card").first()).toContainText(
    /codex-ppt-skill|Paper2Poster/,
  );

  // 退出场景并收藏两个项目，验证“分享清单”入口出现
  await page.getByTestId("stage-quick-hint").getByRole("button").click();
  await expect(page).not.toHaveURL(/stage=slides/);
  await page.locator('[data-testid^="favorite-"]').nth(0).click();
  await page.locator('[data-testid^="favorite-"]').nth(1).click();
  await expect(page.getByTestId("share-favorites-pack")).toContainText(
    "分享清单 (2)",
  );

  // 2. 打开专属 #pack 链接，验证工具包横幅与一键收藏
  await page.goto(
    "./#pack=Paper2Poster%2FPaper2Poster,Gostyan%2Fdocx-skill-4-cn-paper&packTitle=%E8%AF%BE%E9%A2%98%E7%BB%84%E5%BF%85%E8%A3%85",
  );
  const packBanner = page.getByTestId("pack-banner");
  await expect(packBanner).toBeVisible();
  await expect(packBanner).toContainText("课题组必装");
  await expect(page.getByTestId("repo-card")).toHaveCount(2);
  await page.getByTestId("save-pack-to-favorites").click();
  await page.getByTestId("exit-pack").click();
  await expect(packBanner).toHaveCount(0);

  // 3. 卡片详情抽屉：环境门槛标签、同门分享按钮、网页版 AI 指引
  await page.getByTestId("repo-card").first().click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  const centerDelta = await drawer
    .locator(".drawer-platforms")
    .evaluate((el) => {
      const label = el.querySelector(":scope > span")?.getBoundingClientRect();
      const tag = el.querySelector(".ant-tag")?.getBoundingClientRect();
      return Math.abs(
        label.top + label.height / 2 - (tag.top + tag.height / 2),
      );
    });
  expect(centerDelta).toBeLessThan(1);
  await expect(drawer.getByTestId("setup-thresholds")).toBeVisible();
  await expect(drawer.getByTestId("share-peer-btn")).toBeVisible();
  const webHelper = drawer.getByTestId("web-ai-helper");
  await expect(webHelper).toBeVisible();
  await webHelper.locator("summary").click();
  await expect(drawer.getByTestId("copy-web-ai-prompt")).toBeVisible();
  await page.keyboard.press("Escape");

  // 4. 30 秒看懂 Skill 弹窗包含零命令行网页版兜底说明
  await page.locator(".beginner-entry").click();
  await expect(page.getByTestId("guide-web-fallback")).toBeVisible();
});

test("switching from card view to table view shows animated skeleton instead of plain loading text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/assets/RepositoryTable-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.continue();
  });
  await page.goto("./#view=card");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
  await page
    .getByRole("radio", { name: "表格", exact: true })
    .locator("..")
    .click();
  await expect(page.getByTestId("table-loading-skeleton")).toBeVisible();
  await expect(page.locator(".ant-table-row").first()).toBeVisible();
});
