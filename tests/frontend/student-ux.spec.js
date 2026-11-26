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

test("static SEO topic landing page hydrates pre-filtered state cleanly and drawer renders output previews", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });

  // 1. 直接访问静态任务专题页 /topics/figures/，无 hash 即可自动筛选“科研绘图”并保持干净 URL
  await page.goto("./topics/figures/");
  await expect(page).toHaveTitle(/科研绘图/);
  expect(new URL(page.url()).hash).toBe("");
  await expect(
    page.locator('.task-list button[aria-pressed="true"]'),
  ).toContainText("科研绘图");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
  await expect(page.getByTestId("seo-topic-directory")).toContainText(
    "医学",
  );

  // 2. 打开写作润色类仓库详情，验证 Before/After 前后改写示意预览卡
  await page.goto("./#repo=Adkid-Zephyr%2Fanti-defensive-writing-Skill");
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  const diffPreview = drawer.getByTestId("output-preview-card");
  await expect(diffPreview).toBeVisible();
  await expect(diffPreview).toHaveAttribute("data-preview-mode", "before_after");
  await expect(diffPreview).toContainText("修改前");
  await expect(diffPreview).toContainText("修改后");

  // 3. 打开海报/交付物类仓库详情，验证输入→流程→产出文件示意预览卡
  await page.goto("./#repo=Paper2Poster%2FPaper2Poster");
  await expect(drawer).toBeVisible();
  const deliverablePreview = drawer.getByTestId("output-preview-card");
  await expect(deliverablePreview).toBeVisible();
  await expect(deliverablePreview).toHaveAttribute(
    "data-preview-mode",
    "deliverable",
  );
  await expect(deliverablePreview).toContainText("conference_poster_A0.pptx");
});

test("Shushu AI advisor lazy-loads on demand, answers with grounded picks, and opens detail drawer", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 920 });
  await page.route("https://bot.riceai985.cc/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply:
          "针对本科毕业论文排版，推荐 **Gostyan/docx-skill-4-cn-paper** 处理高校 Word 格式规范，搭配 **Edwardxlai/easyread** 精读英文文献。",
        provider: "zhipu-glm-4-flash",
      }),
    }),
  );

  await page.goto("./");
  // 验证可一键放出全屏漫游鼠鼠桌宠，鼠鼠真实跑动且点击可打开对话框
  await page.getByTestId("shushu-roam-toggle").click();
  const roamer = page.getByTestId("roaming-mascot");
  await expect(roamer).toBeVisible();
  const startTransform = await roamer.evaluate((el) => el.style.transform);
  await expect
    .poll(() => roamer.evaluate((el) => el.style.transform))
    .not.toBe(startTransform);
  await roamer.locator("button").click();

  const panel = page.getByTestId("shushu-bot-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId("shushu-bot-promo")).toHaveAttribute(
    "href",
    "https://catfk.com/shop/1991",
  );
  await panel.locator(".shushu-bot-starter-btn").first().click();

  await expect(panel.getByTestId("shushu-msg-assistant")).toContainText(
    "docx-skill-4-cn-paper",
  );
  await expect(panel.getByTestId("shushu-followups")).toBeVisible();
  const firstPick = panel.getByTestId("shushu-pick-card").first();
  await expect(firstPick).toBeVisible();
  await firstPick.click();

  await expect(page.getByTestId("shushu-bot-panel")).toHaveCount(0);
  await expect(page.getByRole("dialog")).toContainText("docx-skill-4-cn-paper");

  // 刷新页面后重新打开鼠鼠，会话级记忆依然保留刚才推荐的记录
  await page.goto("./");
  await page.getByTestId("shushu-bot-trigger").click();
  await expect(
    page.getByTestId("shushu-bot-panel").getByTestId("shushu-msg-assistant"),
  ).toContainText("docx-skill-4-cn-paper");
});

test("static skill SEO page, auto preview for new repos, direct web prompt, and returning discipline memory work end to end", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 960 });

  // 1. 直接访问独立静态项目 SEO 落地页，自动打开详情抽屉且保持无 hash 干净地址
  await page.goto("./skills/Yuan1z0825/nature-skills/");
  await expect(page).toHaveTitle(/nature-skills/);
  expect(new URL(page.url()).hash).toBe("");
  const drawer = page.getByRole("dialog");
  await expect(drawer).toContainText("Yuan1z0825/nature-skills");
  await expect(drawer.getByTestId("drawer-recharge-tip")).toBeVisible();
  await expect(drawer.getByTestId("drawer-alternatives")).toBeVisible();
  await expect(
    drawer.getByTestId("drawer-alt-card").first(),
  ).toBeVisible();

  // 2. 打开未手动配置的新收录写作类 Skill，自动生成使用前后示意卡 + 免开 GitHub 完整指令 + 写作备选提示
  await page.goto("./#repo=YuanZHAO321%2FScientific-Writing-zh");
  await expect(drawer).toContainText("YuanZHAO321/Scientific-Writing-zh");
  const autoPreview = drawer.getByTestId("output-preview-card");
  await expect(autoPreview).toBeVisible();
  await expect(autoPreview).toContainText("典型场景示意");
  await drawer.getByTestId("web-ai-helper").locator("summary").click();
  await expect(drawer.getByTestId("copy-direct-web-prompt")).toBeVisible();
  await expect(drawer.getByTestId("drawer-zhi1ke-tip")).toBeVisible();

  // 3. 选择“经济学”后重新访问首页，展示上次浏览专业提示并支持一键切回
  await page.goto("./");
  await page.locator('[data-discipline="economics"]').click();
  await expect(page.locator('[data-discipline="economics"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("./");
  const hint = page.getByTestId("returning-discipline-hint");
  await expect(hint).toContainText("经济学");
  await hint.locator(".returning-discipline-apply").click();
  await expect(page.locator('[data-discipline="economics"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("Shushu mascot trigger transitions smoothly without DOM snap under standard motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("./");

  const trigger = page.getByTestId("shushu-bot-trigger");
  const roamToggle = page.getByTestId("shushu-roam-toggle");
  await expect(trigger.locator(".shushu-mascot-stage")).toHaveCount(1);
  await expect(roamToggle).toBeVisible();

  // 悬停预热并点击：控宠胶囊保持挂载平滑收起，对话框带入场与退场动画
  await trigger.hover();
  await trigger.click();

  const panel = page.getByTestId("shushu-bot-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveClass(/is-open/);
  await expect(roamToggle).toHaveCount(1);
  await expect(roamToggle).toHaveClass(/is-hidden/);

  await trigger.click();
  await expect(panel).toHaveCount(0);
  await expect(roamToggle).toBeVisible();
});

test("lazy history loading, deep subskill search handoff, and zero-login recommend modal work end to end", async ({
  page,
}) => {
  const historyRequests = [];
  page.on("request", (req) => {
    if (req.url().includes("/data/history.js")) historyRequests.push(req.url());
  });
  await page.addInitScript(() => {
    window.__ARS_BOT_API = "local-only";
  });
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("./");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
  expect(historyRequests).toHaveLength(0);

  // 0. 验证「最多安装」快捷排序按钮可切换 #sort=installs 并在首张卡片展示真实安装/下载量（且详情页不含 Forks）
  await page.getByRole("button", { name: "最多安装" }).click();
  await expect(page).toHaveURL(/#sort=installs/);
  await expect(
    page.getByTestId("repo-card").first().getByTestId("card-installs"),
  ).toBeVisible();

  // 1. 首页大搜索框穿透检索合集仓库内的具体子技能（如 scanpy）
  await page.locator("#searchInput").fill("scanpy");
  const hitBadge = page.getByTestId("card-subskill-hit").first();
  await expect(hitBadge).toBeVisible();
  await expect(hitBadge).toContainText("scanpy");

  // 点击卡片打开详情抽屉，子技能浏览器自动定位到 scanpy
  await page.getByTestId("repo-card").first().click();
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByTestId("subskills-search")).toHaveValue("scanpy");
  await page.keyboard.press("Escape");

  // 2. 点击导航栏「推荐 Skill」打开免登录弹窗，支持已收录提示与新项目一键提交
  await page.getByRole("link", { name: "推荐 Skill", exact: true }).click();
  const recModal = page.getByTestId("recommend-skill-modal");
  await expect(recModal).toBeVisible();
  const repoInput = recModal.getByTestId("recommend-repo-input");
  await repoInput.fill("https://github.com/K-Dense-AI/scientific-agent-skills");
  await expect(recModal.getByTestId("recommend-existing-hit")).toBeVisible();

  await repoInput.fill("https://github.com/example-lab/new-research-skill");
  await expect(recModal.getByTestId("recommend-existing-hit")).toHaveCount(0);
  await recModal.getByTestId("recommend-submit-btn").click();
  await expect(page.getByTestId("recommend-skill-done")).toContainText(
    "example-lab/new-research-skill",
  );
});
