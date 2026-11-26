import { test, expect } from "./fixtures.js";
import { readFileSync } from "node:fs";
const data = JSON.parse(
  readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
);
async function fixtureCard(page) {
  const fixture = {
    ...data.items[0],
    repo: "example/paper-skill",
    url: "https://github.com/example/paper-skill",
    description: "Original research skill description.",
    repository_kind: "skill",
    skills_count: 17,
    skills_count_complete: true,
    agents: ["claude-code", "codex", "cursor", "gemini"],
  };
  await page.route("**/data/rankings.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.ACADEMIC_SKILLS_RANKINGS=${JSON.stringify({ metadata: data.metadata, items: [fixture] })};`,
    }),
  );
}

test("reference palette, right-hand search and default cards give a compact first screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1160 });
  await page.goto("./#related=1");
  await expect(page.getByTestId("repo-card")).toHaveCount(
    Math.min(30, data.items.length),
  );
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(244, 247, 250)",
  );
  await expect(page.locator(".portal-kpi-card")).toHaveCount(4);
  const title = await page.locator("h1").boundingBox();
  const search = await page.locator("#searchInput").boundingBox();
  expect(search.y).toBeGreaterThan(title.y + title.height);
  expect(Math.abs(search.y - (await page.locator(".page-tabs").boundingBox()).y)).toBeLessThan(10);
  const first = await page.getByTestId("repo-card").first().boundingBox();
  const kpiHeight = (await page.locator(".portal-kpi-grid").boundingBox()).height + 24;
  const noticeHeight = (await page.locator(".top-notice-bar").boundingBox()).height + 16;
  // Daily discoveries precede the first ranked card while poster sits in the hero top-right.
  expect(first.y).toBeLessThan(560 + kpiHeight + noticeHeight + (await page.getByTestId("discipline-selector").boundingBox()).height + 24 + (await page.locator(".beginner-entry").boundingBox()).height + 12);
  expect(first.y + first.height).toBeLessThan(900 + kpiHeight + noticeHeight + (await page.getByTestId("discipline-selector").boundingBox()).height + 24 + (await page.locator(".beginner-entry").boundingBox()).height + 12);
  await expect(page.locator(".task-selection-indicator")).toHaveCSS(
    "background-color",
    "rgb(13, 159, 110)",
  );
  await expect(page.locator(".task-list [aria-pressed=true]")).toHaveCSS(
    "border-top-width",
    "0px",
  );
});

test("cards separate owner and project and put compact metadata on one aligned footer", async ({
  page,
}) => {
  await fixtureCard(page);
  await page.goto("./#related=1&view=card");
  const card = page.getByTestId("repo-card").first();
  await expect(card.locator(".repository-owner")).toHaveText("example");
  await expect(card.locator(".repo-title")).toHaveText("paper-skill");
  await expect(card.locator(".card-info-footer")).toContainText("90 天未更新");
  await expect(card.locator(".card-platforms")).toContainText("+");
  await expect(card.locator(".card-platforms .ant-tag")).toHaveCount(0);
  await card.hover();
  await expect(card.locator("[data-compare]")).toBeVisible();
  await card.locator("[data-compare]").click();
  await expect(page.getByTestId("compare-tray")).toBeVisible();
  await expect(card.locator("[data-compare]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

for (const width of [1280, 390])
  test(`one distinct advertisement precedes the first row at ${width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 1160 });
    await page.goto("./#related=1&view=card");
    const ad = page.getByTestId("hero-poster-ad");
    const firstCardTop = await page
      .getByTestId("repo-card")
      .first()
      .evaluate((e) => e.getBoundingClientRect().top);
    const box = await ad.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(firstCardTop + 1);
    await expect(ad.getByRole("link")).toHaveAttribute(
      "href",
      /https:\/\/(catfk\.com\/shop\/1991|zhi1ke\.com\?pic=6PEB)/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("filtered results without editorial picks do not offer an empty beginner path", async ({
  page,
}) => {
  await fixtureCard(page);
  await page.goto("./#related=1&view=card");
  await expect(page.getByTestId("repo-card")).toHaveCount(1);
  await expect(page.getByTestId("editorial-picks")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "新手路径", exact: true }),
  ).toHaveCount(0);
});
