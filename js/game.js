"use strict";
S.Game = class {
  constructor(canvas) {
    this.renderer = new S.Renderer(canvas);
    this.camera = new S.Camera();
    this.bodyGrid = new S.SpatialGrid(100);
    this.foodGrid = new S.SpatialGrid(120);
    this.snakes = [];
    this.food = [];
    this.particles = [];
    this.started = false;
    this.paused = false;
    this.menuOpen = false;
    this.recording = false;
    this.time = 0;
    this.pointer = {
      x: innerWidth / 2 + 180,
      y: innerHeight / 2,
      active: false,
      down: false,
    };
    this.doubleUntil = 0;
    this.totalCashed = 0;
    this.runCashed = 0;
    this.bestMass = 0;
    this.deathReason = "";
    this.accumulator = 0;
    this.lastTime = 0;
    this.fps = 60;
    this.hudTimer = 0;
    this.onDeath = null;
    this.onHUD = null;
    this.reset(false);
  }
  reset(start = true) {
    this.snakes = [];
    this.food = [];
    this.particles = [];
    this.bodyGrid.clear();
    this.foodGrid.clear();
    this.time = 0;
    this.started = start;
    this.paused = false;
    this.runCashed = 0;
    this.pointer.down = false;
    this.doubleUntil = 0;
    this.player = new S.Snake(
      0,
      0,
      S.config.startMass,
      S.config.skin,
      S.config.playerName || "Вы",
      true,
    );
    this.player.angle = 0;
    this.player.targetAngle = 0;
    this.player.buildBody();
    this.snakes.push(this.player);
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.zoom = S.config.zoom;
    this.bestMass = this.player.mass;
    this.rebuildBodies();
    for (let i = 0; i < S.config.botCount; i++) this.spawnBot();
    for (let i = 0; i < S.config.foodCount; i++) this.spawnFood();
    this.rebuildFoods();
    this.rebuildBodies();
  }
  spawnBot() {
    const p = S.spawnPoint(this, true),
      c = S.config,
      mass =
        c.botMass *
        S.rand(0.55, 1.35) *
        (Math.random() < c.largeBotChance ? S.rand(2, 4) : 1),
      name = S.botNames[S.nextSnakeId % S.botNames.length];
    const s = new S.Snake(p.x, p.y, Math.min(6000, mass), S.randomSkin(), name);
    s.angle = Math.atan2(-p.y, -p.x) + S.rand(-1, 1);
    s.targetAngle = s.angle;
    s.buildBody();
    this.snakes.push(s);
    return s;
  }
  addFood(x, y, value = 1, dropped = false) {
    const f = {
      x,
      y,
      value: S.clamp(value, 0.5, 30),
      dropped,
      color: Math.floor(Math.random() * 4),
      phase: Math.random() * 7,
      eaten: false,
    };
    this.food.push(f);
    this.foodGrid.insert(f);
    return f;
  }
  spawnFood() {
    const a = Math.random() * Math.PI * 2,
      r = Math.sqrt(Math.random()) * (S.config.worldRadius - 50);
    return this.addFood(Math.cos(a) * r, Math.sin(a) * r, S.rand(0.8, 3));
  }
  rebuildFoods() {
    this.foodGrid.clear();
    for (const f of this.food) if (!f.eaten) this.foodGrid.insert(f);
  }
  rebuildBodies() {
    this.bodyGrid.clear();
    for (const s of this.snakes) {
      if (!s.alive) continue;
      for (let i = 0; i < s.points.length; i += 2) {
        const p = s.points[i];
        this.bodyGrid.insert({
          x: p.x,
          y: p.y,
          snake: s,
          index: i,
          radius: s.radius,
        });
      }
    }
  }
  kill(victim, killer = null, reason = "Столкновение") {
    if (!victim.alive) return false;
    if (victim.player && (!this.started || S.config.mode === "immortal"))
      return false;
    victim.alive = false;
    if (killer && killer !== victim && killer.alive) {
      S.rewardKill(killer, victim);
      if (killer.player && S.toast)
        S.toast(
          (S.config.balanceEnabled
            ? "+" +
              S.format(
                (S.config.killReward +
                  victim.balance * S.config.transferShare) *
                  S.config.balanceRate,
              ) +
              " · "
            : "") +
            victim.name +
            " повержен",
        );
    }
    const points = victim.points,
      total = Math.min(victim.mass * 0.8, 4500),
      step = Math.max(1, Math.ceil(points.length / 150)),
      count = Math.ceil(points.length / step);
    for (let i = 0; i < points.length; i += step) {
      const p = points[i];
      this.addFood(
        p.x + S.rand(-12, 12),
        p.y + S.rand(-12, 12),
        total / count,
        true,
      );
      if (S.config.showParticles && this.particles.length < 700)
        for (let k = 0; k < 2; k++)
          this.particles.push({
            x: p.x,
            y: p.y,
            vx: S.rand(-90, 90),
            vy: S.rand(-90, 90),
            size: S.rand(2, 5),
            color: S.skinColor(victim.skin)[0],
            life: 1,
            maxLife: 1,
          });
    }
    if (victim.player) {
      this.deathReason = reason;
      if (this.onDeath) this.onDeath(victim, reason);
    }
    return true;
  }
  update(dt) {
    this.time += dt;
    const c = S.config;
    let bots = this.snakes.reduce(
      (n, s) => n + (!s.player && s.alive ? 1 : 0),
      0,
    );
    while (bots < c.botCount) {
      this.spawnBot();
      bots++;
    }
    if (bots > c.botCount) {
      for (let i = this.snakes.length - 1; i >= 0 && bots > c.botCount; i--)
        if (!this.snakes[i].player && this.snakes[i].alive) {
          this.snakes.splice(i, 1);
          bots--;
        }
    }
    for (const s of this.snakes) {
      if (!s.alive) continue;
      if (s.player && this.started && !c.autopilot) {
        if (this.pointer.active) {
          const p = this.camera.screenToWorld(
            this.pointer.x,
            this.pointer.y,
            this.renderer.width,
            this.renderer.height,
          );
          if (Math.hypot(p.x - s.x, p.y - s.y) > 8)
            s.targetAngle = Math.atan2(p.y - s.y, p.x - s.x);
        }
        s.boost = this.pointer.down || this.time < this.doubleUntil;
      } else S.driveAI(s, this, dt);
      s.update(dt, this);
    }
    this.rebuildBodies();
    const deaths = new Map();
    for (const s of this.snakes) {
      if (!s.alive) continue;
      if (Math.hypot(s.x, s.y) > c.worldRadius - s.radius) {
        if (s.player && (!this.started || c.mode === "immortal")) {
          const a = Math.atan2(s.y, s.x),
            r = c.worldRadius - s.radius;
          s.x = Math.cos(a) * r;
          s.y = Math.sin(a) * r;
          s.targetAngle = a + Math.PI;
          s.angle += S.clamp(S.angleDiff(s.targetAngle, s.angle), -0.15, 0.15);
        } else deaths.set(s, { killer: null, reason: "Граница арены" });
      }
      const nearby = this.bodyGrid.query(s.x, s.y, s.radius + 60);
      for (const b of nearby) {
        if (b.snake === s || !b.snake.alive) continue;
        const hit = (s.radius + b.radius) * 0.83;
        if (S.distance2(s, b) < hit * hit) {
          if (s.player && c.mode === "immortal") continue;
          deaths.set(s, {
            killer: b.snake,
            reason:
              b.index < 3
                ? "Встречное столкновение"
                : "Столкновение с " + b.snake.name,
          });
          break;
        }
      }
      const food = this.foodGrid.query(s.x, s.y, s.radius + 22);
      for (const f of food) {
        if (f.eaten) continue;
        if (S.distance2(s, f) < (s.radius + 7 + Math.sqrt(f.value)) ** 2) {
          f.eaten = true;
          S.rewardFood(s, f.value);
        }
      }
    }
    // Resolve the snapshot together so head-on collisions cannot depend on array order.
    for (const [s, hit] of deaths) {
      const killer = hit.killer && !deaths.has(hit.killer) ? hit.killer : null;
      this.kill(s, killer, hit.reason);
    }
    this.snakes = this.snakes.filter((s) => s.alive || s.player);
    this.food = this.food.filter((f) => !f.eaten);
    const shortage = c.foodCount - this.food.length;
    for (let i = 0; i < Math.min(25, shortage); i++) this.spawnFood();
    if (this.food.length > c.foodCount + 3500)
      this.food.splice(0, this.food.length - c.foodCount - 3500);
    this.rebuildFoods();
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      return p.life > 0;
    });
    this.bestMass = Math.max(this.bestMass, this.player.mass);
    this.camera.update(dt, this.player, this.recording);
  }
  frame(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const elapsed = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    if (elapsed > 0)
      this.fps = S.lerp(this.fps, Math.min(240, 1 / elapsed), 0.04);
    const running =
      !this.paused && !this.menuOpen && (!this.started || this.player.alive);
    if (running) {
      this.accumulator += elapsed;
      let steps = 0;
      while (this.accumulator >= 1 / 60 && steps < 5) {
        this.update(1 / 60);
        this.accumulator -= 1 / 60;
        steps++;
        if (
          this.paused ||
          this.menuOpen ||
          (this.started && !this.player.alive)
        ) {
          this.accumulator = 0;
          break;
        }
      }
      if (steps === 5) this.accumulator = 0;
    } else this.accumulator = 0;
    this.renderer.render(this);
    this.hudTimer += elapsed;
    if (this.hudTimer > 0.12) {
      this.hudTimer = 0;
      if (this.onHUD) this.onHUD();
    }
    requestAnimationFrame((t) => this.frame(t));
  }
  applySettings(key, old) {
    const c = S.config;
    this.player.skin = c.skin;
    this.player.name = c.playerName || "Вы";
    if (key === "quality" || key === "*") this.renderer.resize();
    if (
      key === "worldRadius" ||
      (key === "*" && c.worldRadius !== old.worldRadius)
    ) {
      const radius = c.worldRadius - 120;
      for (const s of this.snakes) {
        const r = Math.hypot(s.x, s.y);
        if (r > radius) {
          const scale = radius / r;
          const dx = s.x * scale - s.x,
            dy = s.y * scale - s.y;
          s.x += dx;
          s.y += dy;
          for (const p of s.points) {
            p.x += dx;
            p.y += dy;
          }
        }
      }
      this.food = this.food.filter(
        (f) => Math.hypot(f.x, f.y) < c.worldRadius - 20,
      );
      this.rebuildFoods();
    }
    if (key === "foodCount" && this.food.length > c.foodCount)
      this.food.length = c.foodCount;
    if (
      !this.started &&
      (key === "startMass" || key === "startBalance" || key === "*")
    ) {
      this.player.mass = c.startMass;
      this.player.balance = c.startBalance;
      this.player.displayBalance = c.startBalance;
      this.player.buildBody();
    }
    this.player.thinkTimer = 0;
  }
};
