const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const { test } = require("node:test");
const { startTestSite, testPerson, prisma } = require("./browser-fixture");

const movements = 1000;
const collectBetweenSessions = process.env.CONTROLA_PROFILE_COLLECT === "1";
const milliseconds = (value) => Number(value.toFixed(2));
const mib = (bytes) => milliseconds(bytes / 1024 ** 2);

async function prepare(site) {
  const owner = await testPerson(site.url, "Persona de perfilado");
  const other = await testPerson(site.url, "Control de perfilado");
  const { userId } = owner.references;
  const expense = await prisma.category.findFirstOrThrow({ where: { userId, type: "EXPENSE" } });
  const secondary = await prisma.account.create({ data: { userId, name: "Cuenta secundaria", initialBalance: "500" } });
  await prisma.movement.createMany({ data: Array.from({ length: movements }, (_, index) => ({
    ...owner.references,
    ...(index % 3 === 0 ? {} : { type: "EXPENSE", categoryId: expense.id }),
    accountId: index % 2 === 0 ? owner.references.accountId : secondary.id,
    amount: String(10 + index % 90) + ".35",
    date: new Date(Date.UTC(2026, index % 12, 1 + index % 27, 12)),
    description: "Movimiento de perfilado " + index,
  })) });
  await prisma.movement.createMany({ data: Array.from({ length: 25 }, () => ({
    ...other.references, amount: "7.50", description: "Control de perfilado ajeno",
  })) });
  return owner;
}

async function rendererPrivateMib(browserCdp) {
  if (process.platform !== "win32") return null;
  const { processInfo } = await browserCdp.send("SystemInfo.getProcessInfo");
  const renderers = processInfo.filter(({ type, id }) => type === "renderer" && Number.isInteger(id));
  const ids = renderers.map(({ id }) => id).join(",");
  if (!ids) return null;
  const bytes = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "(Get-Process -Id " + ids + " -ErrorAction SilentlyContinue | Measure-Object PrivateMemorySize64 -Sum).Sum",
  ], { encoding: "utf8", timeout: 5000, windowsHide: true }).trim();
  return bytes ? mib(Number(bytes)) : null;
}

async function memory(cdp, browserCdp) {
  const [{ usedSize }, { nodes }] = await Promise.all([
    cdp.send("Runtime.getHeapUsage"), cdp.send("Memory.getDOMCounters"),
  ]);
  return { jsHeapMib: mib(usedSize), nodes, rendererPrivateMib: await rendererPrivateMib(browserCdp) };
}

async function metrics(cdp) {
  const { metrics: counters } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(counters.map(({ name, value }) => [name, value]));
}

function cpuSummary(profile) {
  const names = new Map(profile.nodes.map(({ id, callFrame }) => [id, callFrame.functionName || "(anónima)"]));
  const durations = new Map();
  for (const [index, id] of profile.samples.entries()) {
    const name = names.get(id);
    durations.set(name, (durations.get(name) ?? 0) + profile.timeDeltas[index] / 1000);
  }
  return Object.fromEntries([...durations].filter(([name]) => name !== "(idle)")
    .sort(([, first], [, second]) => second - first).slice(0, 6)
    .map(([name, time]) => [name, milliseconds(time)]));
}

test("perfil diagnóstico del panel con CPU, asignaciones Intl y memoria", async () => {
  const site = await startTestSite();
  try {
    const owner = await prepare(site);
    const context = await site.browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.formatterCounters = {};
      for (const name of ["DateTimeFormat", "NumberFormat"]) {
        window.formatterCounters[name] = { count: 0, ms: 0 };
        Intl[name] = new Proxy(Intl[name], {
          construct(target, args, newTarget) {
            const start = performance.now();
            const formatter = Reflect.construct(target, args, newTarget);
            const counter = window.formatterCounters[name];
            counter.count += 1;
            counter.ms += performance.now() - start;
            return formatter;
          },
        });
      }
    });
    await page.goto(site.url, { waitUntil: "load" });
    const cdp = await context.newCDPSession(page);
    const browserCdp = await site.browser.newBrowserCDPSession();
    await cdp.send("Performance.enable");
    await cdp.send("Profiler.enable");
    console.log("PERFIL_INICIO " + JSON.stringify({ collectBetweenSessions, ...await memory(cdp, browserCdp) }));

    for (let index = 1; index <= 7; index += 1) {
      await page.locator('input[name="email"]').fill(owner.email);
      await page.locator('input[name="password"]').fill(owner.password);
      await page.evaluate(() => {
        for (const counter of Object.values(window.formatterCounters)) {
          counter.count = 0;
          counter.ms = 0;
        }
      });
      const before = await metrics(cdp);
      await cdp.send("Profiler.start");
      const start = performance.now();
      await page.getByRole("button", { name: "Entrar" }).click();
      await page.waitForFunction((count) => document.querySelectorAll(".movement-item").length === count, movements);
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const elapsed = milliseconds(performance.now() - start);
      const { profile } = await cdp.send("Profiler.stop");
      const after = await metrics(cdp);
      const formatters = await page.evaluate(() => window.formatterCounters);
      const active = await memory(cdp, browserCdp);
      assert.equal(await page.getByText("Control de perfilado ajeno", { exact: true }).count(), 0);
      await page.getByRole("button", { name: "Cerrar sesión" }).press("Enter");
      assert.equal(await page.locator(".movement-item").count(), 0);
      if (collectBetweenSessions) await cdp.send("HeapProfiler.collectGarbage");
      const inactive = await memory(cdp, browserCdp);
      console.log("PERFIL " + JSON.stringify({
        index, elapsed,
        dateCount: formatters.DateTimeFormat.count,
        dateMs: milliseconds(formatters.DateTimeFormat.ms),
        moneyCount: formatters.NumberFormat.count,
        moneyMs: milliseconds(formatters.NumberFormat.ms),
        scriptMs: milliseconds((after.ScriptDuration - before.ScriptDuration) * 1000),
        layoutMs: milliseconds((after.LayoutDuration - before.LayoutDuration) * 1000),
        active, inactive, topCpuMs: cpuSummary(profile),
      }));
    }

    await cdp.send("HeapProfiler.collectGarbage");
    console.log("PERFIL_TRAS_GC " + JSON.stringify(await memory(cdp, browserCdp)));
  } finally {
    await site.close();
  }
});
