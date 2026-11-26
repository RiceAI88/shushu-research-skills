import { test, expect } from "./fixtures.js";

for (const [width, view] of [
  [1440, "table"],
  [390, "card"],
]) {
  test(`hero poster ad stays separate from ranked entries and supports dual slides at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`./#view=${view}`);
    const ad = page.getByTestId("hero-poster-ad");
    await expect(ad).toHaveCount(1);
    await expect(ad).not.toContainText("广告");

    // 默认首张海报：自营 AI 订阅代充（含 ChatGPT / Claude / Gemini / Codex）
    await expect(ad).toContainText("专业 AI 订阅正规代充");
    await expect(ad).not.toContainText("catfk.com");
    await expect(ad).toContainText("ChatGPT");
    await expect(ad).toContainText("Claude");
    await expect(ad).toContainText("Gemini");
    await expect(ad).toContainText("Codex");
    const rechargeLink = ad.getByTestId("poster-slide-recharge");
    await expect(rechargeLink).toHaveAttribute("href", "https://catfk.com/shop/1991");
    await expect(rechargeLink).toHaveAttribute("target", "_blank");
    await expect(rechargeLink).toHaveAttribute("rel", /sponsored/);
    await expect(rechargeLink).toHaveAttribute("rel", /noopener/);

    // 手动切换到第二张海报：智一刻 AI
    await ad.getByTestId("poster-tab-zhi1ke").click();
    await expect(ad).toContainText("从一个题目，到一篇论文初稿。");
    await expect(ad).toContainText("免费无限改稿");
    await expect(ad).toContainText("重复率AI率不达标直接退");
    const zhiLink = ad.getByTestId("poster-slide-zhi1ke");
    await expect(zhiLink).toHaveAttribute("href", "https://zhi1ke.com?pic=6PEB");
    await expect(zhiLink).toHaveAttribute("rel", /sponsored/);
    await expect(ad.locator("img")).toHaveJSProperty("complete", true);

    const entries = page.locator(
      view === "table" ? ".ant-table-row" : '[data-testid="repo-card"]',
    );
    await expect(entries).toHaveCount(30);
    const positions = await page.evaluate(() => ({
      adBottom: document
        .querySelector('[data-testid="hero-poster-ad"]')
        .getBoundingClientRect().bottom,
      searchTop: document
        .querySelector("#searchInput")
        .getBoundingClientRect().top,
      searchWidth: document
        .querySelector(".hero-toolbar > .hero-search")
        .getBoundingClientRect().width,
      first: document
        .querySelector('.ant-table-row, [data-testid="repo-card"]')
        .getBoundingClientRect().top,
    }));
    expect(positions.adBottom).toBeLessThanOrEqual(positions.searchTop + 6);
    expect(positions.adBottom).toBeLessThan(positions.first);
    if (width >= 1280) {
      expect(positions.searchWidth).toBeGreaterThan(760);
    }

    await page
      .getByRole("searchbox")
      .fill("K-Dense-AI/scientific-agent-skills");
    await expect(entries).toHaveCount(1);
    await expect(ad).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("mobile English dark poster ad stays readable and does not repeat when loading more", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#view=card&lang=en&theme=dark");
  const ad = page.getByTestId("hero-poster-ad");
  await expect(ad).not.toContainText("Advertisement");
  await expect(ad).toContainText("Gemini");
  await ad.getByTestId("poster-tab-zhi1ke").click();
  await expect(
    ad.getByRole("link", { name: /Generate a free outline/ }),
  ).toBeVisible();
  await page.getByTestId("load-more").click();
  await expect(page.getByTestId("repo-card")).toHaveCount(60);
  await expect(ad).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
