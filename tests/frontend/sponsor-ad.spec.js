import { test, expect } from "./fixtures.js";

for (const [width, view] of [
  [1440, "table"],
  [390, "card"],
]) {
  test(`hero dual partner cards stay separate from ranked entries and show both services simultaneously at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`./#view=${view}`);
    const ad = page.getByTestId("hero-poster-ad");
    await expect(ad).toHaveCount(1);
    await expect(ad).not.toContainText("广告");

    // 左卡：自营 AI 订阅代充（含 ChatGPT / Claude / Gemini / Codex，不展示 catfk.com）
    const rechargeLink = ad.getByTestId("poster-slide-recharge");
    await expect(rechargeLink).toBeVisible();
    await expect(rechargeLink).toContainText("专业 AI 订阅正规代充");
    await expect(ad).not.toContainText("catfk.com");
    await expect(rechargeLink).toContainText("ChatGPT");
    await expect(rechargeLink).toContainText("Claude");
    await expect(rechargeLink).toContainText("Gemini");
    await expect(rechargeLink).toContainText("Codex");
    await expect(rechargeLink).toHaveAttribute("href", "https://catfk.com/shop/1991");
    await expect(rechargeLink).toHaveAttribute("target", "_blank");
    await expect(rechargeLink).toHaveAttribute("rel", /sponsored/);
    await expect(rechargeLink).toHaveAttribute("rel", /noopener/);

    // 右卡：智一刻 AI 同屏并排可见（无需手动点击或等待轮播）
    const zhiLink = ad.getByTestId("poster-slide-zhi1ke");
    await expect(zhiLink).toBeVisible();
    await expect(zhiLink).toContainText("从一个题目，到一篇论文初稿。");
    await expect(zhiLink).toContainText("免费无限改稿");
    await expect(zhiLink).toContainText("重复率AI率不达标直接退");
    await expect(zhiLink).toHaveAttribute("href", "https://zhi1ke.com?pic=6PEB");
    await expect(zhiLink).toHaveAttribute("rel", /sponsored/);
    await expect(ad.locator("img")).toHaveJSProperty("complete", true);

    const entries = page.locator(
      view === "table" ? ".ant-table-row" : '[data-testid="repo-card"]',
    );
    await expect(entries).toHaveCount(30);
    const positions = await page.evaluate(() => ({
      searchBottom: document
        .querySelector("#searchInput")
        .getBoundingClientRect().bottom,
      searchWidth: document
        .querySelector(".hero-search-stage")
        .getBoundingClientRect().width,
      adTop: document
        .querySelector('[data-testid="hero-poster-ad"]')
        .getBoundingClientRect().top,
      adBottom: document
        .querySelector('[data-testid="hero-poster-ad"]')
        .getBoundingClientRect().bottom,
      first: document
        .querySelector('.ant-table-row, [data-testid="repo-card"]')
        .getBoundingClientRect().top,
    }));
    expect(positions.adTop).toBeGreaterThanOrEqual(positions.searchBottom - 2);
    expect(positions.adBottom).toBeLessThan(positions.first);
    if (width >= 1280) {
      expect(positions.searchWidth).toBeGreaterThan(740);
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

test("mobile English dark dual partner strip stays readable and does not repeat when loading more", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#view=card&lang=en&theme=dark");
  const ad = page.getByTestId("hero-poster-ad");
  await expect(ad).not.toContainText("Advertisement");
  await expect(ad).toContainText("Gemini");
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
