import { test, expect } from "./fixtures.js";

for (const width of [1280, 390])
  test(`redundant header ads are removed and consolidated into hero poster at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./#view=card");
    await expect(page.getByTestId("gpt-recharge-ad")).toHaveCount(0);
    await expect(page.locator(".top-notice-partner")).toHaveCount(0);
    const ad = page.getByTestId("hero-poster-ad");
    await expect(ad).toHaveCount(1);
    await expect(ad).not.toContainText("广告");
    const link = ad.getByTestId("poster-slide-recharge");
    await expect(link).toHaveAttribute("href", "https://catfk.com/shop/1991");
    await expect(link).toHaveAttribute("rel", /sponsored.*noopener/);
    await expect(link).toHaveAttribute("target", "_blank");
    await page.getByTestId("load-more").click();
    await expect(page.getByTestId("repo-card")).toHaveCount(60);
    await expect(ad).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("English dark table retains hero poster separately from repository rows", async ({
  page,
}) => {
  await page.goto("./#view=table&lang=en&theme=dark");
  await expect(page.getByTestId("gpt-recharge-ad")).toHaveCount(0);
  const ad = page.getByTestId("hero-poster-ad");
  await expect(ad).not.toContainText("Advertisement");
  await expect(page.locator(".ant-table-row")).toHaveCount(30);
  expect(await ad.evaluate((e) => e.closest(".ant-table") === null)).toBe(true);
  await expect(ad.getByTestId("poster-slide-recharge")).toHaveAttribute(
    "href",
    "https://catfk.com/shop/1991",
  );
});

test("English poster advertisement fits a narrow dark mobile screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("./#view=card&lang=en&theme=dark");
  const ad = page.getByTestId("hero-poster-ad");
  await expect(ad).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
