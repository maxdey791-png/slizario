const { chromium } = require("playwright-core");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto(process.argv[2] || "http://127.0.0.1:8080");
  await p.waitForFunction(() => window.slizario);
  const results = [];
  for (const bots of [24, 80])
    results.push(
      await p.evaluate(async (bots) => {
        const g = slizario;
        let seed = 349;
        Math.random = () =>
          (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
        S.replace({
          ...S.defaults,
          botCount: bots,
          botMass: 1800,
          largeBotChance: 0.4,
          foodCount: 4000,
          worldRadius: 1400,
          autoZoom: false,
          autopilot: true,
          startMass: 240,
        });
        g.reset(true);
        document.getElementById("welcome").hidden = true;
        g.menuOpen = false;
        g.paused = false;
        let simulation = 0,
          last = 0,
          count = 0;
        const cpu = [],
          intervals = [],
          draw = g.renderer.render,
          update = g.update;
        g.update = function (dt) {
          const t = performance.now();
          update.call(this, dt);
          simulation += performance.now() - t;
        };
        await new Promise((resolve) => {
          g.renderer.render = function (game) {
            const now = performance.now(),
              t = now;
            draw.call(this, game);
            count++;
            if (count > 45) {
              cpu.push(simulation + performance.now() - t);
              intervals.push(now - last);
            }
            simulation = 0;
            last = now;
            if (count === 225) {
              g.renderer.render = draw;
              g.update = update;
              g.menuOpen = true;
              resolve();
            }
          };
        });
        const summarize = (a) => {
          a.sort((x, y) => x - y);
          return {
            medianMs: +a[Math.floor(a.length * 0.5)].toFixed(2),
            p95Ms: +a[Math.floor(a.length * 0.95)].toFixed(2),
            over25ms: a.filter((x) => x > 25).length,
          };
        };
        return {
          bots,
          cpu: summarize(cpu),
          frame: summarize(intervals),
          canvas: [g.renderer.canvas.width, g.renderer.canvas.height],
        };
      }, bots),
    );
  console.log(JSON.stringify(results));
  await b.close();
})();
