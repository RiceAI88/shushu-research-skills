import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
test("both language pages version data scripts by their deployed content", async () => {
  for (const script of ["rankings", "history"]) {
    const content = await readFile(`dist/data/${script}.js`);
    const version = createHash("sha256").update(content).digest("hex").slice(0, 12);
    for (const page of ["index.html", "en/index.html"]) {
      const html = await readFile(`dist/${page}`, "utf8");
      assert.ok(html.includes(`data/${script}.js?v=${version}"`), `${page}: ${script} must bypass previous data cache`);
    }
  }
});
test("production site preserves both language entries and public data resources", async () => {
  for (const name of [
    "index.html",
    "en/index.html",
    "data/rankings.json",
    "data/rankings.csv",
    "data/rankings.js",
    "data/history.js",
    "feed.xml",
    "sitemap.xml",
    "llms.txt",
    "llms-full.txt",
    "manifest.webmanifest",
    "404.html",
    "robots.txt",
    "reports/index.html",
    "assets/styles.css",
    "assets/og-cover.png",
    "LICENSE",
  ])
    await access("dist/" + name);
  for (const name of ["index.html", "en/index.html"]) {
    const html = await readFile("dist/" + name, "utf8");
    assert.match(html, /id="root"/);
    assert.match(html, /\/assets\/[^" ]+\.js/);
    assert.match(html, /\/data\/rankings\.js/);
    assert.doesNotMatch(html, /src="[^" ]*assets\/app\.js/);
    assert.match(html, /rel="canonical"/);
    assert.match(html, /og:image/);
  }
});
test("website build excludes development code and keeps monthly report assets", async () => {
  for (const name of [
    "scripts",
    "tests",
    "node_modules",
    "assets/app.js",
    "docs/superpowers",
    "data/repository-catalog.json",
    "data/collection-report.json",
    "data/collection-events.json",
    "data/first-seen.json",
    "data/editorial-status.json",
    "data/history",
  ])
    await assert.rejects(access("dist/" + name));
  const report = await readFile("dist/reports/index.html", "utf8");
  assert.match(report, /\.\.\/assets\/styles\.css/);
  const data = JSON.parse(await readFile("dist/data/rankings.json", "utf8"));
  assert(Array.isArray(data.items));
  const original = JSON.parse(await readFile("data/rankings.json", "utf8"));
  assert.deepEqual(data, original);
});

test("static SEO discipline and topic landing pages carry self-canonical metadata, filtered JSON-LD, and versioned data", async () => {
  const rankingsHash = createHash("sha256")
    .update(await readFile("dist/data/rankings.js"))
    .digest("hex")
    .slice(0, 12);
  for (const [slug, expectedSeed, expectedKeyword] of [
    ["disciplines/medicine", "#discipline=medicine&sort=fit", "医学"],
    ["disciplines/economics", "#discipline=economics&sort=fit", "经济学"],
    ["topics/figures", "#task=figures", "科研绘图"],
    ["topics/write", "#task=write", "论文写作"],
  ]) {
    const html = await readFile(`dist/${slug}/index.html`, "utf8");
    assert.ok(
      html.includes(`rel="canonical" href="https://riceai985.cc/${slug}/"`),
      `${slug}: missing self-canonical`,
    );
    assert.doesNotMatch(html, /hreflang="/);
    assert.ok(html.includes(expectedKeyword), `${slug}: missing topic title keyword`);
    assert.ok(
      html.includes(`window.__ARS_INITIAL_HASH=${JSON.stringify(expectedSeed)}`),
      `${slug}: missing initial state seed`,
    );
    assert.ok(
      html.includes(`/data/rankings.js?v=${rankingsHash}"`),
      `${slug}: must reference root-relative versioned rankings.js`,
    );
    const ldMatch = html.match(
      /<script type="application\/ld\+json" id="ld-json">([\s\S]*?)<\/script>/,
    );
    assert.ok(ldMatch, `${slug}: missing JSON-LD`);
    const ld = JSON.parse(ldMatch[1]);
    assert.equal(ld["@type"], "ItemList");
    assert.equal(ld.url, `https://riceai985.cc/${slug}/`);
    assert.ok(ld.itemListElement.length > 0, `${slug}: empty ItemList`);
    assert.match(html, /<noscript><section><h1>/);
  }
});

test("static SEO skill detail pages render SoftwareSourceCode JSON-LD and initial drawer seed", async () => {
  const html = await readFile(
    "dist/skills/Yuan1z0825/nature-skills/index.html",
    "utf8",
  );
  assert.ok(
    html.includes(
      'rel="canonical" href="https://riceai985.cc/skills/Yuan1z0825/nature-skills/"',
    ),
  );
  assert.ok(
    html.includes(
      'window.__ARS_INITIAL_HASH="#repo=Yuan1z0825%2Fnature-skills"',
    ),
  );
  const ldMatch = html.match(
    /<script type="application\/ld\+json" id="ld-json">([\s\S]*?)<\/script>/,
  );
  assert.ok(ldMatch);
  const ld = JSON.parse(ldMatch[1]);
  assert.equal(ld["@type"], "SoftwareSourceCode");
  assert.equal(ld.name, "Yuan1z0825/nature-skills");

  const indexHtml = await readFile("dist/index.html", "utf8");
  assert.match(indexHtml, /href="\/skills\/[^"]+\/"/);
  const llms = await readFile("dist/llms.txt", "utf8");
  assert.match(llms, /https:\/\/riceai985\.cc\/skills\//);
  assert.match(llms, /llms-full\.txt/);
});

test("rankings script uses defer and manifest icons match real PNG dimensions", async () => {
  for (const page of [
    "dist/index.html",
    "dist/en/index.html",
    "dist/disciplines/medicine/index.html",
    "dist/skills/Yuan1z0825/nature-skills/index.html",
  ]) {
    const html = await readFile(page, "utf8");
    assert.match(html, /<script\b[^>]*\bdefer\b[^>]*\bsrc="\/data\/rankings\.js\?v=/);
  }
  const manifest = JSON.parse(await readFile("dist/manifest.webmanifest", "utf8"));
  const purposes = new Set();
  for (const icon of manifest.icons) {
    assert.doesNotMatch(icon.purpose || "", /\bany\s+maskable\b/);
    purposes.add(icon.purpose);
    const bytes = await readFile("dist" + icon.src);
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    assert.equal(`${width}x${height}`, icon.sizes, `${icon.src} PNG dimensions must match declared sizes`);
  }
  assert.ok(purposes.has("any") && purposes.has("maskable"));
});
