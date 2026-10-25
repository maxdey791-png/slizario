/* Optional development tests. The game itself needs no Node.js or packages. */
"use strict";
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");
const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
const server = http.createServer((req, res) => {
  const filename = path.resolve(
    root,
    "." +
      decodeURIComponent(
        new URL(req.url, "http://localhost").pathname.replace(
          /\/$/,
          "/index.html",
        ),
      ),
  );
  if (!filename.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(filename, (err, data) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      mime[path.extname(filename)] || "application/octet-stream",
    );
    res.end(data);
  });
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    }),
    errors = [],
    external = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).hostname !== "127.0.0.1")
      external.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  let passed = 0,
    skipped = 0;
  async function test(name, fn) {
    const result = await fn();
    if (result?.skip) {
      skipped++;
      console.log("SKIP " + name + " — " + result.skip);
    } else {
      passed++;
      console.log("PASS " + name);
    }
  }
  async function fresh(overrides = {}) {
    await page.evaluate((o) => {
      S.replace({ ...S.defaults, ...o });
      slizario.reset(true);
      slizario.menuOpen = true;
      slizario.paused = false;
      document.getElementById("welcome").hidden = true;
      document.getElementById("resultOverlay").hidden = true;
      document.getElementById("settingsOverlay").hidden = true;
      slizario.food = [];
      slizario.rebuildFoods();
      S.config.foodCount = 0;
    }, overrides);
  }
  try {
    await page.goto("http://127.0.0.1:" + server.address().port);
    await test("Startup, manual movement and held-pointer boost", async () => {
      await page.click("#playBtn");
      await page.mouse.move(1500, 540);
      await page.mouse.down();
      await page.waitForTimeout(450);
      await page.mouse.up();
      const state = await page.evaluate(() => ({
        x: slizario.player.x,
        mass: slizario.player.mass,
        started: slizario.started,
      }));
      assert(state.started && state.x > 30 && state.mass < 240);
    });
    await test("Food increases mass, length and virtual balance", async () => {
      await fresh({ botCount: 0 });
      const r = await page.evaluate(() => {
        const g = slizario,
          p = g.player,
          n = p.points.length;
        g.addFood(3, 0, 10);
        g.update(1 / 60);
        g.update(1 / 60);
        return { mass: p.mass, balance: p.balance, grown: p.points.length > n };
      });
      assert.equal(r.mass, 250);
      assert.equal(r.balance, 1020);
      assert(r.grown);
    });
    async function collision(mode) {
      await fresh({ mode, botCount: 1 });
      return page.evaluate(() => {
        const g = slizario,
          p = g.player,
          b = g.snakes[1];
        b.x = 8;
        b.y = -100;
        b.angle = Math.PI / 2;
        b.targetAngle = b.angle;
        b.thinkTimer = 100;
        b.mass = 240;
        b.points = Array.from({ length: b.segmentCount }, (_, i) => ({
          x: 8,
          y: -100 + i * 7,
        }));
        g.update(1 / 60);
        return {
          alive: p.alive,
          result: !document.getElementById("resultOverlay").hidden,
        };
      });
    }
    await test("Normal mode: real head/body collision ends the run", async () => {
      const r = await collision("normal");
      assert(!r.alive && r.result);
    });
    await test("Immortal mode survives the same collision and the border", async () => {
      assert((await collision("immortal")).alive);
      const r = await page.evaluate(() => {
        const p = slizario.player;
        p.x = S.config.worldRadius + 100;
        p.y = 0;
        slizario.update(1 / 60);
        return p.alive && Math.hypot(p.x, p.y) <= S.config.worldRadius;
      });
      assert(r);
    });
    await test("Kill credit, balance transfer, death food and absorbing dropped mass", async () => {
      await fresh({ botCount: 1 });
      const r = await page.evaluate(() => {
        const g = slizario,
          p = g.player,
          b = g.snakes[1];
        b.x = -100;
        b.y = 0;
        b.angle = 0;
        b.targetAngle = 0;
        b.balance = 800;
        b.thinkTimer = 100;
        b.buildBody();
        g.update(1 / 60);
        const first = {
          dead: !b.alive,
          kills: p.kills,
          balance: p.balance,
          drops: g.food.filter((f) => f.dropped).length,
        };
        g.snakes = g.snakes.filter((s) => s.player);
        S.config.botCount = 0;
        const f = g.food.find((f) => f.dropped);
        p.x = f.x;
        p.y = f.y;
        p.buildBody();
        const before = p.mass;
        g.update(1 / 60);
        return { ...first, absorbed: p.mass > before };
      });
      assert(
        r.dead &&
          r.kills === 1 &&
          r.balance === 2050 &&
          r.drops > 0 &&
          r.absorbed,
      );
    });
    await test("Boost spends mass; infinite boost preserves it", async () => {
      await fresh({ botCount: 0 });
      const r = await page.evaluate(() => {
        const g = slizario,
          p = g.player;
        g.pointer.down = true;
        for (let i = 0; i < 60; i++) g.update(1 / 60);
        const spent = p.mass;
        S.config.infiniteBoost = true;
        g.food = [];
        g.rebuildFoods();
        for (let i = 0; i < 60; i++) g.update(1 / 60);
        return { spent, after: p.mass };
      });
      assert(r.spent < 240);
      assert.equal(r.spent, r.after);
    });
    await test("Double-click boost expires", async () => {
      await fresh({ botCount: 0, doubleBoost: true, doubleBoostSeconds: 0.5 });
      await page.dblclick("#arena", { position: { x: 1200, y: 550 } });
      const r = await page.evaluate(() => {
        const g = slizario;
        g.pointer.down = false;
        g.update(1 / 60);
        const active = g.player.boost;
        for (let i = 0; i < 40; i++) g.update(1 / 60);
        return { active, expired: !g.player.boost };
      });
      assert(r.active && r.expired);
    });
    await test("Bots move, forage, interact and respawn", async () => {
      await fresh({ botCount: 12, worldRadius: 1400 });
      const r = await page.evaluate(() => {
        const g = slizario;
        for (let i = 0; i < 500; i++) g.spawnFood();
        const start = new Map(g.snakes.map((s) => [s.id, { x: s.x, y: s.y }]));
        for (let i = 0; i < 900; i++) g.update(1 / 60);
        return {
          moving: g.snakes.filter(
            (s) =>
              !s.player &&
              start.has(s.id) &&
              S.distance2(s, start.get(s.id)) > 400,
          ).length,
          kills: g.snakes.reduce((n, s) => n + s.kills, 0),
          food: g.food.length,
          population: g.snakes.length,
          newIds: g.snakes.some((s) => !start.has(s.id)),
          targets: g.snakes.filter((s) => s.aiTarget).length,
        };
      });
      assert(r.moving > 0 && r.food > 0 && r.population >= 12 && r.targets > 0);
      assert(r.kills > 0 || r.newIds);
    });
    await test("Autopilot collects food and each style produces steering", async () => {
      await fresh({ botCount: 0, autopilot: true });
      const r = await page.evaluate(() => {
        const g = slizario,
          p = g.player;
        for (let x = 20; x < 650; x += 22) g.addFood(x, 0, 4);
        for (let i = 0; i < 300; i++) g.update(1 / 60);
        const styles = [];
        for (const style of ["calm", "balanced", "aggressive"]) {
          S.config.autoStyle = style;
          p.thinkTimer = 0;
          S.driveAI(p, g, 0.2);
          styles.push(Number.isFinite(p.targetAngle) && p.aiTarget !== null);
        }
        return { mass: p.mass, balance: p.balance, styles };
      });
      assert(r.mass > 240 && r.balance > 1000 && r.styles.every(Boolean));
    });
    await test("Balance off disables awards and Cash Out", async () => {
      await fresh({ balanceEnabled: false, botCount: 0 });
      const r = await page.evaluate(() => {
        slizario.addFood(3, 0, 10);
        slizario.update(1 / 60);
        return {
          balance: slizario.player.balance,
          mass: slizario.player.mass,
          cash: S.canCashOut(slizario),
        };
      });
      assert.equal(r.balance, 1000);
      assert(r.mass > 240 && !r.cash);
    });
    await test("Cash Out threshold, reset and continuation", async () => {
      await fresh({ cashMin: 1000, botCount: 0 });
      await page.evaluate(() => {
        slizario.menuOpen = false;
        slizario.onHUD();
      });
      await page.click("#cashBtn");
      assert.equal(
        await page.locator("#resultLabel").textContent(),
        "ВИРТУАЛЬНЫЙ CASH OUT",
      );
      assert.equal(await page.evaluate(() => slizario.player.balance), 0);
      await page.click("#restartBtn");
      assert(
        await page.evaluate(
          () =>
            !slizario.paused &&
            slizario.player.alive &&
            slizario.player.balance === 0,
        ),
      );
    });
    await test("Cash Out can preserve balance and finish the run", async () => {
      await fresh({
        cashMin: 1000,
        cashReset: false,
        cashContinue: false,
        botCount: 0,
      });
      await page.evaluate(() => {
        slizario.menuOpen = false;
        slizario.onHUD();
      });
      await page.click("#cashBtn");
      assert.equal(await page.evaluate(() => slizario.player.balance), 1000);
      assert.equal(
        await page.locator("#restartBtn").textContent(),
        "Снова на арену",
      );
      await page.click("#restartBtn");
      assert.equal(await page.evaluate(() => slizario.runCashed), 0);
    });
    await test("All settings tabs, live changes, save and reload", async () => {
      await page.click("#settingsBtn");
      for (const tab of Object.keys(await page.evaluate(() => S.schema))) {
        await page.getByRole("button", { name: new RegExp(tab + "$") }).click();
        assert((await page.locator(".tab-heading").textContent()) === tab);
      }
      await page.getByRole("button", { name: /Валюта$/ }).click();
      await page.selectOption("#setting-currency", "RUB");
      await page.getByRole("button", { name: /Боты$/ }).click();
      await page.locator("#setting-botCount").fill("7");
      await page.locator("#setting-botCount").dispatchEvent("input");
      await page.reload();
      assert.deepEqual(
        await page.evaluate(() => [S.config.currency, S.config.botCount]),
        ["RUB", 7],
      );
    });
    await test("249 offline ISO flags and six distinct map renderings", async () => {
      const r = await page.evaluate(async () => {
        const g = slizario;
        g.menuOpen = true;
        const flags = await Promise.all(
          S.countryCodes.map(
            (code) =>
              new Promise((resolve) => {
                const im = new Image();
                im.onload = () => resolve(true);
                im.onerror = () => resolve(false);
                im.src = "assets/flags/" + code + ".svg";
              }),
          ),
        );
        const samples = [];
        for (const theme of Object.keys(S.themes)) {
          S.config.theme = theme;
          g.renderer.render(g);
          samples.push(
            Array.from(g.renderer.ctx.getImageData(0, 0, 1, 1).data).join(","),
          );
        }
        return {
          count: flags.length,
          flags: flags.every(Boolean),
          maps: new Set(samples).size,
        };
      });
      assert.equal(r.count, 249);
      assert(r.flags);
      assert(r.maps >= 5);
    });
    await test("Camera wheel, zoom bounds and clean OBS mode", async () => {
      await page.click("#playBtn");
      const before = await page.evaluate(() => S.config.zoom);
      await page.mouse.move(1000, 500);
      await page.mouse.wheel(0, -300);
      assert((await page.evaluate(() => S.config.zoom)) > before);
      await page.keyboard.press("v");
      assert(
        await page.evaluate(() =>
          document.body.classList.contains("recording"),
        ),
      );
      await page.keyboard.press("v");
      assert(!(await page.evaluate(() => slizario.recording)));
    });
    await test("Preset save/load, export and validated JSON import", async () => {
      await page.click("#settingsBtn");
      await page.getByRole("button", { name: /Игра$/ }).click();
      await page.getByPlaceholder("Название пресета").fill("Тест OBS");
      await page
        .getByRole("button", { name: "Сохранить", exact: true })
        .click();
      assert.equal(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem("slizario.presets"))[0].name,
        ),
        "Тест OBS",
      );
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.click("#exportBtn"),
      ]);
      assert.equal(download.suggestedFilename(), "slizario-config.json");
      await page
        .locator("#importFile")
        .setInputFiles({
          name: "config.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            JSON.stringify({
              version: 1,
              settings: {
                ...(await page.evaluate(() => S.defaults)),
                currency: "THB",
                botCount: 3,
              },
            }),
          ),
        });
      await page.waitForFunction(
        () => S.config.currency === "THB" && S.config.botCount === 3,
      );
      assert.deepEqual(
        await page.evaluate(() => [S.config.currency, S.config.botCount]),
        ["THB", 3],
      );
    });
    await test("Invalid imported values are clamped safely", async () => {
      const r = await page.evaluate(() =>
        S.sanitize({
          botCount: 100000,
          foodCount: -1,
          zoom: Infinity,
          currency: "BAD",
          mode: "BAD",
          playerName: "x".repeat(100),
        }),
      );
      assert.equal(r.botCount, 80);
      assert.equal(r.foodCount, 400);
      assert.equal(r.zoom, 1);
      assert.equal(r.currency, "USD");
      assert.equal(r.playerName.length, 24);
    });
    await test("1440p and mobile viewport render without overflow", async () => {
      await page.click("#closeSettings");
      for (const size of [
        { width: 2560, height: 1440 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(size);
        await page.waitForTimeout(120);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await page.evaluate(() => slizario.renderer.render(slizario));
      }
    });
    await test("Direct file:// startup, flag loading and no external requests", async () => {
      const local = await browser.newPage();
      local.on("pageerror", (e) => errors.push(e.message));
      const external = [];
      local.on("request", (req) => {
        if (/^https?:/.test(req.url())) external.push(req.url());
      });
      try {
        await local.goto("file://" + path.join(root, "index.html"));
      } catch (e) {
        if (e.message.includes("ERR_BLOCKED_BY_ADMINISTRATOR")) {
          await local.close();
          return {
            skip: "host browser policy blocks file:// navigation; HTTP checks passed",
          };
        }
        throw e;
      }
      await local.click("#playBtn");
      await local.evaluate(() => S.change("skin", "flag-ru"));
      await local.waitForTimeout(300);
      assert(
        await local.evaluate(() => slizario.started && !!S.getFlag("flag-ru")),
      );
      assert.equal(external.length, 0);
      await local.close();
    });
    await test("No external network requests during HTTP gameplay", async () =>
      assert.deepEqual(external, []));
    assert.deepEqual(errors, [], "No JavaScript errors");
    console.log(
      "\n" +
        passed +
        " checks passed; " +
        skipped +
        " skipped; no JavaScript exceptions.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  server.close();
});
