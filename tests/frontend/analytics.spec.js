import { test, expect } from "./fixtures.js";

const site = "https://riceai985.cc/";
const clarityTag = "https://www.clarity.ms/tag/zihqusczc3";
const laSdk = "https://sdk.51.la/js-sdk-pro.min.js";

async function productionPage(page, { automated = false } = {}) {
  if (!automated) {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "webdriver", { get: () => false }),
    );
  }
  await page.route("https://riceai985.cc/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: `http://127.0.0.1:4173${url.pathname}${url.search}`,
    });
    await route.fulfill({ response });
  });
}

const mockClarity = `
window.__clarityCalls = (window.clarity && window.clarity.q ? [...window.clarity.q] : []).map(a => Array.from(a));
window.clarity = function() { window.__clarityCalls.push(Array.from(arguments)); };
`;
const mockLa = `
window.__laInits = [];
window.__laEvents = [];
window.LA = {
  init(cfg) { window.__laInits.push(cfg); },
  track(name, data) { window.__laEvents.push({ name, data }); }
};
`;

for (const entry of ["", "en/"]) {
  test(`Clarity and 51LA initialize cleanly and record custom conversion events at ${entry || "Chinese entry"}`, async ({
    page,
  }) => {
    await productionPage(page);
    await page.route(clarityTag, (route) =>
      route.fulfill({ contentType: "application/javascript", body: mockClarity }),
    );
    await page.route(laSdk, (route) =>
      route.fulfill({ contentType: "application/javascript", body: mockLa }),
    );
    await page.goto(
      `${site}${entry}?utm_source=douyin&utm_medium=video&utm_campaign=skills_nav#view=card`,
    );
    await expect
      .poll(() => page.evaluate(() => window.__clarityCalls?.length || 0))
      .toBeGreaterThanOrEqual(1);
    await expect
      .poll(() => page.evaluate(() => window.__laInits?.length || 0))
      .toBe(1);

    const script = page.locator(`script[src="${clarityTag}"]`);
    await expect(script).toHaveAttribute("data-clarity-id", "zihqusczc3");

    const laInit = await page.evaluate(() => window.__laInits[0]);
    expect(laInit.id).toBe("3RvWxo8gzUw6CRfi");
    expect(laInit.ck).toBe("3RvWxo8gzUw6CRfi");

    const calls = await page.evaluate(() => window.__clarityCalls);
    expect(calls).toContainEqual([
      "set",
      "entry_url",
      `/${entry}?utm_source=douyin&utm_medium=video&utm_campaign=skills_nav`,
    ]);
  });
}

test("late tracker preserves the original campaign and failure leaves the ranking usable", async ({
  page,
}) => {
  await productionPage(page);
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(clarityTag, async (route) => {
    await gate;
    await route.fulfill({
      contentType: "application/javascript",
      body: mockClarity,
    });
  });
  try {
    await page.goto(`${site}?utm_source=wechat&utm_medium=group`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("repo-card").first()).toBeVisible();
    await page.getByRole("searchbox").fill("paper");
    release();
    await expect
      .poll(() => page.evaluate(() => window.__clarityCalls?.length || 0))
      .toBeGreaterThanOrEqual(1);
    const calls = await page.evaluate(() => window.__clarityCalls);
    expect(calls).toContainEqual([
      "set",
      "entry_url",
      "/?utm_source=wechat&utm_medium=group",
    ]);
  } finally {
    release();
  }
  await page.route(clarityTag, (route) => route.abort());
  await page.reload();
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
  await page.getByRole("searchbox").fill("zotero");
  await expect(page).toHaveURL(/q=zotero/);
});

test("local previews and automated production visits never load the tracker", async ({
  page,
}) => {
  let requests = 0;
  await page.route(clarityTag, (route) => {
    requests++;
    return route.abort();
  });
  await page.goto("./");
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
  expect(requests).toBe(0);
  await productionPage(page, { automated: true });
  await page.goto(site);
  await expect(page.getByTestId("repo-card").first()).toBeVisible();
  expect(requests).toBe(0);
});
