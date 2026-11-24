import { test, expect } from "./fixtures.js";

test("community QR hides external card and opens accessible full image from top bar", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator(".community-card")).toHaveCount(0);
  const trigger = page.getByRole("button", { name: /加入各专业科研交流群/ });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "各专业科研 Skills 交流群" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("img")).toHaveJSProperty("naturalWidth", 660);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("mobile community trigger opens QR dialog without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".community-card")).toHaveCount(0);
  const trigger = page.getByRole("button", { name: /加入各专业科研交流群/ });
  await expect(trigger).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "关闭二维码" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("dialog close icon stays centered with a quiet hover style", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /加入各专业科研交流群/ }).click();
  const close = page.getByRole("button", { name: "关闭二维码" });
  const icon = close.locator("svg");
  await expect(icon).toBeVisible();
  const buttonBox = await close.boundingBox();
  const iconBox = await icon.boundingBox();
  expect(Math.abs(buttonBox.x + buttonBox.width / 2 - iconBox.x - iconBox.width / 2)).toBeLessThan(1);
  expect(Math.abs(buttonBox.y + buttonBox.height / 2 - iconBox.y - iconBox.height / 2)).toBeLessThan(1);
  await expect(close).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await close.hover();
  await close.click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("slow QR image opens community dialog immediately with skeleton and reveals image once loaded", async ({
  page,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/research-community-*.jpg", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("./");
    await page.getByRole("button", { name: /加入各专业科研交流群/ }).click();
    const dialog = page.getByRole("dialog", { name: "各专业科研 Skills 交流群" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.community-qr-skeleton[aria-busy="true"]')).toBeVisible();
    release();
    await expect(dialog.locator(".community-qr-skeleton")).toHaveCount(0);
    await expect(dialog.locator("img")).toHaveJSProperty("naturalWidth", 660);
  } finally {
    release();
  }
});
