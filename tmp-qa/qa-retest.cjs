const { chromium } = require("playwright");
const BASE = process.env.QA_BASE || "http://localhost:5174";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const fails = [];

  const check = (name, ok, detail) => {
    console.log(ok ? `PASS ${name}` : `FAIL ${name}`, detail || "");
    if (!ok) fails.push({ name, detail });
  };

  // Cabinet login + nested routes
  await page.goto(BASE + "/cabinet/login", { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill("owner@uzmedatlas.local");
  await page.locator('input[type="password"]').fill("clinic123");
  await page.getByRole("button", { name: /войти/i }).click();
  await page.waitForURL("**/cabinet", { timeout: 15000 }).catch(() => {});
  check("cabinet login", page.url().includes("/cabinet") && !page.url().includes("login"), page.url());

  const clinics = await (await page.request.get(BASE + "/api/cabinet/clinics")).json();
  const items = clinics.items || clinics;
  const id = items[0]?.id;
  check("cabinet has clinics", Boolean(id), String(items?.length));

  if (id) {
    await page.goto(BASE + `/cabinet/clinics/${id}/leads`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const h1Leads = await page.locator("h1").first().innerText();
    check("cabinet leads h1", /заявк/i.test(h1Leads), h1Leads);

    await page.goto(BASE + `/cabinet/clinics/${id}/branches`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const h1Branches = await page.locator("h1").first().innerText();
    const bodyBranches = await page.locator("body").innerText();
    check(
      "cabinet branches page",
      /филиал/i.test(h1Branches) || /филиал/i.test(bodyBranches) && !/ОсновноеО клинике/i.test(bodyBranches),
      h1Branches,
    );

    await page.goto(BASE + `/cabinet/clinics/${id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const h1Edit = await page.locator("h1").first().innerText();
    check("cabinet clinic editor", Boolean(h1Edit) && h1Edit.length > 2, h1Edit);
  }

  // Public branch
  const api = await (await page.request.get(BASE + "/api/clinics")).json();
  const slug = api.items?.[0]?.slug;
  check("public slug not numeric suffix", slug && !/1$/.test(slug) || slug === "atlas-medical-center" || !slug?.includes("atlas"), slug);
  const branches = await (await page.request.get(BASE + `/api/clinics/${slug}/branches`)).json();
  const bslug = branches.items?.[0]?.slug;
  if (bslug) {
    await page.goto(BASE + `/clinics/${slug}/branches/${bslug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const body = await page.locator("body").innerText();
    check("public branch page", /филиал|расположен|маршрут|расписание/i.test(body), body.replace(/\s+/g, " ").slice(0, 180));
  }

  // Mobile overflow
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE + `/clinics/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const ov = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  check("mobile no overflow", ov.sw <= ov.cw + 2, JSON.stringify(ov));

  // Checker
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Открыть Health Checker/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Болит колено/i }).click();
  await page.waitForTimeout(500);
  const input = page.getByLabel(/Сообщение для Health Checker/i);
  await input.fill("35");
  await input.press("Enter");
  await page.waitForTimeout(3500);
  const chat = await page.locator("body").innerText();
  check("checker recommendation", /ортопед|рекомендац/i.test(chat), chat.replace(/\s+/g, " ").slice(0, 200));

  // Lead
  await page.goto(BASE + `/clinics/${slug}`, { waitUntil: "networkidle" });
  await page.locator('input[name="fullName"]').fill("QA Retest");
  await page.locator('input[name="phone"]').fill("+998901112233");
  await page.locator('textarea[name="medicalNeed"], input[name="medicalNeed"]').fill("QA retest medical need");
  await page.getByRole("button", { name: /Отправить заявку/i }).click();
  await page.waitForTimeout(1500);
  const after = await page.locator("body").innerText();
  check("lead submit", /спасибо|отправлен|принят|успеш/i.test(after), after.replace(/\s+/g, " ").slice(0, 200));

  // 404 footer layout
  await page.goto(BASE + "/clinics/missing-xyz", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const footerBox = await page.locator("footer").boundingBox();
  const vh = page.viewportSize()?.height || 900;
  check("404 footer near bottom", footerBox ? footerBox.y + footerBox.height > vh * 0.7 : false, JSON.stringify(footerBox));

  console.log("\nSUMMARY", fails.length ? `FAILS=${fails.length}` : "ALL PASS", fails);
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
