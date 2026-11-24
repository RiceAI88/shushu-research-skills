import { test as base, expect } from "@playwright/test";

// Exercise the entry promotion in its own spec. Other UI tests start unobstructed.
export const test = base.extend({
  showEntryNotice: [false, { option: true }],
  page: async ({ page, showEntryNotice }, use) => {
    if (showEntryNotice) {
      await page.addInitScript(() => {
        window.__ARS_NOTICE_DELAY_MS = 0;
      });
    } else {
      await page.addInitScript(() => {
        // Use the current test clock with a small margin: getItem runs after claimNoticeSlot captures now.
        const getItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
          return key === "prs-recharge-notice-shown-v2" ? String(Date.now() - 1000) : getItem.call(this,key);
        };
      });
    }
    // Never send automated test events to the real analytics accounts.
    await page.route("https://*.clarity.ms/**", route => route.abort());
    await page.route("https://*.51.la/**", route => route.abort());
    await use(page);
  },
});
export { expect };

export async function openScope(page) {
 const trigger=page.getByRole('button',{name:/^(收录范围|Scope)/}).first();
 if(await trigger.getAttribute('aria-expanded')!=='true')await trigger.click();
 await expect(trigger).toHaveAttribute('aria-expanded','true');
}
