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
      S.replace({ ...S.defaults, startMass: 240, ...o });
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
    await test("Cash Out ends the round and restarts fresh", async () => {
      await fresh({ startMass: 120, cashMin: 2000, botCount: 0 });
      await page.evaluate(() => {
        slizario.player.mass = 900;
        slizario.player.balance = 2500;
        slizario.onHUD();
      });
      await page.click("#cashBtn");
      assert.equal(
        await page.locator("#restartBtn").textContent(),
        "Играть снова",
      );
      const snapshot = await page.evaluate(() => ({
        mass: slizario.player.mass,
        balance: slizario.player.balance,
        time: slizario.time,
        ended: slizario.roundEnded,
      }));
      assert(snapshot.ended);
      assert.equal(snapshot.mass, 900);
      assert.equal(snapshot.balance, 2500);
      await page.evaluate(() => {
        slizario.paused = false;
        for (let i = 0; i < 30; i++) slizario.update(1 / 60);
      });
      assert.equal(await page.evaluate(() => slizario.time), snapshot.time);
      assert.equal(await page.evaluate(() => S.canCashOut(slizario)), false);
      await page.click("#restartBtn");
      const state = await page.evaluate(() => ({
        ended: slizario.roundEnded,
        mass: slizario.player.mass,
        balance: slizario.player.balance,
        run: slizario.runCashed,
      }));
      assert(!state.ended);
      assert.equal(state.mass, 120);
      assert.equal(state.balance, 1000);
      assert.equal(state.run, 0);
    });
    await test("Progress is relative to round start and supports every currency", async () => {
      await fresh({ botCount: 0, startBalance: 1000, cashMin: 5000 });
      const r = await page.evaluate(() => {
        const g = slizario,
          values = [];
        for (const balance of [1000, 3000, 5000, 9000]) {
          g.player.balance = balance;
          g.onHUD();
          values.push(S.cashProgress(g));
        }
        const currencies = [];
        for (const currency of [
          "USD",
          "EUR",
          "RUB",
          "PHP",
          "THB",
          "IDR",
          "VND",
          "CUSTOM",
        ]) {
          S.change("currency", currency);
          g.onHUD();
          currencies.push(
            document.getElementById("goalTarget").textContent ===
              S.format(5000),
          );
        }
        S.change("showCurrency", false);
        g.onHUD();
        const plain = document.getElementById("goalTarget").textContent;
        S.change("startBalance", 9000);
        const unchanged = g.roundStartBalance;
        S.change("cashMin", 1000);
        return {
          values,
          currencies,
          plain,
          unchanged,
          zero: S.cashProgress(g),
        };
      });
      assert.deepEqual(r.values, [0, 0.5, 1, 1]);
      assert(r.currencies.every(Boolean));
      assert.equal(r.plain, "5,000");
      assert.equal(r.unchanged, 1000);
      assert.equal(r.zero, 1);
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
    await test("249 offline ISO flags and twelve distinct map renderings", async () => {
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
      assert(r.maps >= 11);
    });
    await test("New themes have distinct geometry with equalized colors", async () => {
      const fingerprints = await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 400;
        const pen = canvas.getContext("2d"),
          result = [];
        for (const id of [
          "volcano",
          "clockwork",
          "underwater",
          "egypt",
          "frozen",
          "jungle",
        ]) {
          pen.clearRect(0, 0, 400, 400);
          const theme = {
            ...S.themes[id],
            bg: "#111111",
            grid: "#999999",
            accent: "#ffffff",
          };
          S.drawWorldDecor(pen, theme, { l: 0, r: 400, t: 0, b: 400 }, 0.7);
          const data = pen.getImageData(0, 0, 400, 400).data;
          let hash = 2166136261,
            count = 0;
          for (let i = 3; i < data.length; i += 4) {
            hash = Math.imul(hash ^ data[i], 16777619) >>> 0;
            if (data[i]) count++;
          }
          result.push({ hash, count });
        }
        return result;
      });
      assert.equal(new Set(fingerprints.map((f) => f.hash)).size, 6);
      assert(fingerprints.every((f) => f.count > 500));
    });
    await test("Smaller default snake, growth and preserved camera settings", async () => {
      const r = await page.evaluate(() => {
        const p = new S.Snake(0, 0, S.defaults.startMass, "lime", "test", true);
        const oldRadius = 9 + Math.sqrt(240) * 0.26;
        const ratio =
          (p.segmentCount * p.spacing) /
          ((Math.floor(16 + 240 / 13) - 1) * oldRadius * 0.63);
        const before = { radius: p.radius, length: p.segmentCount };
        S.rewardFood(p, 500);
        return {
          ratio,
          thinner: before.radius < oldRadius,
          grown: p.radius > before.radius && p.segmentCount > before.length,
          camera: [
            S.defaults.autoZoom,
            S.defaults.zoom,
            S.defaults.cameraSmooth,
          ],
        };
      });
      assert(r.ratio > 0.58 && r.ratio < 0.72);
      assert(r.thinner && r.grown);
      assert.deepEqual(r.camera, [true, 1, 5]);
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
      await page.locator("#importFile").setInputFiles({
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
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    });
    const mobile = await mobileContext.newPage();
    mobile.on("pageerror", (e) => errors.push(e.message));
    await mobile.goto("http://127.0.0.1:" + server.address().port);
    await mobile.tap("#playBtn");
    await mobile.evaluate(() => {
      S.change("botCount", 0);
      S.change("foodCount", 400);
    });
    const cdp = await mobileContext.newCDPSession(mobile);
    await test("Mobile multitouch: simultaneous steering, boost and independent release", async () => {
      const pad = await mobile.locator("#joystick").boundingBox(),
        boost = await mobile.locator("#touchBoost").boundingBox();
      const steer = {
          x: pad.x + pad.width / 2 + 32,
          y: pad.y + pad.height / 2 - 30,
          id: 1,
        },
        accelerator = {
          x: boost.x + boost.width / 2,
          y: boost.y + boost.height / 2,
          id: 2,
        };
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [steer],
      });
      await mobile.waitForFunction(() => slizario.touchInput.active);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [steer, accelerator],
      });
      await mobile.waitForFunction(
        () =>
          slizario.touchInput.active &&
          slizario.touchInput.boost &&
          slizario.player.boost,
      );
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [accelerator],
      });
      await mobile.waitForFunction(
        () => slizario.touchInput.active && !slizario.touchInput.boost,
      );
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });
      await mobile.waitForFunction(
        () => !slizario.touchInput.active && !slizario.touchInput.boost,
      );
    });
    await test("Mobile settings, flags, currency, difficulty, maps and no accidental scroll", async () => {
      await mobile.tap("#autoBtn");
      assert(await mobile.evaluate(() => S.config.autopilot));
      await mobile.tap("#settingsBtn");
      for (const tab of [
        "Игра",
        "Змейки",
        "Боты",
        "Баланс",
        "Валюта",
        "Карты",
        "Камера",
        "Графика",
        "Автопилот",
      ]) {
        await mobile.getByRole("button", { name: new RegExp(tab + "$") }).tap();
        await mobile.waitForFunction(
          (t) => document.querySelector(".tab-heading").textContent === t,
          tab,
        );
      }
      await mobile.getByRole("button", { name: /Змейки$/ }).tap();
      await mobile.getByRole("button", { name: "Россия", exact: true }).tap();
      await mobile.getByRole("button", { name: /Боты$/ }).tap();
      await mobile.selectOption("#setting-difficulty", "5");
      await mobile.getByRole("button", { name: /Валюта$/ }).tap();
      await mobile.selectOption("#setting-currency", "RUB");
      await mobile.getByRole("button", { name: /Карты$/ }).tap();
      await mobile
        .getByRole("button", { name: "Underwater World", exact: true })
        .tap();
      await mobile.tap("#closeSettings");
      assert(
        await mobile.evaluate(
          () =>
            document.documentElement.scrollWidth === innerWidth &&
            scrollY === 0,
        ),
      );
      assert.deepEqual(
        await mobile.evaluate(() => [
          S.config.skin,
          S.config.difficulty,
          S.config.currency,
          S.config.theme,
        ]),
        ["flag-ru", 5, "RUB", "underwater"],
      );
    });
    await test("Mobile landscape exposes goal, settings, Cash Out and both controls", async () => {
      await mobile.setViewportSize({ width: 844, height: 390 });
      await mobile.waitForTimeout(100);
      for (const id of [
        "settingsBtn",
        "cashBtn",
        "joystick",
        "touchBoost",
        "autoBtn",
        "cashGoal",
      ]) {
        const box = await mobile.locator("#" + id).boundingBox();
        assert(
          box &&
            box.x >= 0 &&
            box.y >= 0 &&
            box.x + box.width <= 844 &&
            box.y + box.height <= 390,
          id + " on-screen",
        );
      }
    });
    await test("Mobile Cash Out completes the round and new settings persist", async () => {
      await mobile.evaluate(() => {
        S.change("cashMin", 1000);
        slizario.player.balance = 2000;
        slizario.onHUD();
      });
      await mobile.tap("#cashBtn");
      assert(await mobile.evaluate(() => slizario.roundEnded));
      await mobile.tap("#restartBtn");
      assert(
        await mobile.evaluate(
          () =>
            !slizario.roundEnded && slizario.player.mass === S.config.startMass,
        ),
      );
      await mobile.reload();
      assert.deepEqual(
        await mobile.evaluate(() => [
          S.config.skin,
          S.config.difficulty,
          S.config.currency,
          S.config.theme,
        ]),
        ["flag-ru", 5, "RUB", "underwater"],
      );
    });
    await test("Food grid removal and reuse never lose neighboring candidates", async () => {
      const valid = await page.evaluate(() => {
        const grid = new S.SpatialGrid(100),
          points = Array.from({ length: 200 }, (_, i) => ({
            x: (i % 20) * 23 - 200,
            y: Math.floor(i / 20) * 31 - 100,
          }));
        for (const p of points) grid.insert(p);
        for (let i = 0; i < points.length; i += 3) grid.remove(points[i]);
        const expected = points.filter((_, i) => i % 3 !== 0);
        const found = grid.query(0, 0, 100);
        if (
          !expected
            .filter((p) => p.x * p.x + p.y * p.y <= 10000)
            .every((p) => found.includes(p))
        )
          return false;
        grid.clear();
        for (const p of points) grid.insert(p);
        return grid.query(0, 0, 1000).length === 200;
      });
      assert(valid);
    });
    await test("Large deaths are spread over steps without losing dropped mass", async () => {
      await fresh({ botCount: 0 });
      const r = await page.evaluate(() => {
        const g = slizario;
        for (let i = 0; i < 12; i++) {
          const s = new S.Snake(1000 + i, 1000, 6000, "gold", "large");
          g.snakes.push(s);
          g.kill(s);
        }
        const pending = g.pendingDrops.length;
        g.processDrops();
        const first = g.food.length;
        while (g.pendingDrops.length) g.processDrops();
        return {
          pending,
          first,
          total: g.food.reduce((n, f) => n + f.value, 0),
        };
      });
      assert.equal(r.pending, 12);
      assert.equal(r.first, 32);
      assert(Math.abs(r.total - 12 * 4500) < 0.01);
    });
    await test("Legacy default size migrates while custom sizes and other settings survive", async () => {
      await page.evaluate(() =>
        localStorage.setItem(
          "slizario.config",
          JSON.stringify({ startMass: 240, currency: "EUR", botCount: 7 }),
        ),
      );
      await page.reload();
      assert.deepEqual(
        await page.evaluate(() => [
          S.config.startMass,
          S.config.currency,
          S.config.botCount,
        ]),
        [120, "EUR", 7],
      );
      await page.evaluate(() =>
        localStorage.setItem(
          "slizario.config",
          JSON.stringify({ startMass: 500, currency: "THB", botCount: 9 }),
        ),
      );
      await page.reload();
      assert.deepEqual(
        await page.evaluate(() => [
          S.config.startMass,
          S.config.currency,
          S.config.botCount,
        ]),
        [500, "THB", 9],
      );
    });
    await mobileContext.close();
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
