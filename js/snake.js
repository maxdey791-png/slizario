"use strict";
S.nextSnakeId = 0;
S.Snake = class {
  constructor(x, y, mass, skin, name, player = false) {
    this.id = ++S.nextSnakeId;
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.skin = skin;
    this.name = name;
    this.player = player;
    this.angle = S.rand(-Math.PI, Math.PI);
    this.targetAngle = this.angle;
    this.alive = true;
    this.balance = player
      ? S.config.startBalance
      : S.config.botBalance * S.rand(0.55, 1.65);
    this.displayBalance = this.balance;
    this.kills = 0;
    this.boost = false;
    this.boostVisual = 0;
    this.points = [];
    this.thinkTimer = player ? 0 : (this.id % 13) * 0.011;
    this.aiNear = [];
    this.aiFood = [];
    this.aiTarget = null;
    this.aiMode = "forage";
    this.age = 0;
    this.shedTimer = 0;
    this.distance = 0;
    this.buildBody();
  }
  get radius() {
    return (
      9 +
      Math.sqrt(this.mass) * 0.26 -
      (this.player ? 1.1 * Math.exp(-this.mass / 700) : 0)
    );
  }
  get spacing() {
    return this.radius * 0.63;
  }
  get segmentCount() {
    return Math.min(420, Math.floor(16 + this.mass / 13));
  }
  buildBody() {
    this.points = [];
    for (let i = 0; i < this.segmentCount; i++)
      this.points.push({
        x: this.x - Math.cos(this.angle) * i * this.spacing,
        y: this.y - Math.sin(this.angle) * i * this.spacing,
      });
  }
  update(dt, game) {
    if (!this.alive) return;
    const c = S.config;
    this.age += dt;
    const canBoost =
      this.boost && (c.infiniteBoost || !c.massDrain || this.mass > 65);
    this.boostVisual = S.lerp(
      this.boostVisual,
      canBoost ? 1 : 0,
      1 - Math.exp(-dt * 10),
    );
    const difficultyScale = this.player
      ? 1
      : 0.65 + Number(c.difficulty) * 0.075;
    const speed =
      c.speed *
      difficultyScale *
      (canBoost ? c.boostMultiplier : 1) *
      (1 - 0.12 * S.clamp(this.mass / 8000, 0, 1));
    const turnRate = (canBoost ? 2.8 : 3.6) / Math.max(1, this.radius / 16);
    this.angle += S.clamp(
      S.angleDiff(this.targetAngle, this.angle),
      -turnRate * dt,
      turnRate * dt,
    );
    this.x += Math.cos(this.angle) * speed * dt;
    this.y += Math.sin(this.angle) * speed * dt;
    this.distance += speed * dt;
    if (canBoost && c.massDrain && !c.infiniteBoost) {
      const spent = Math.min(this.mass - 60, c.boostCost * dt);
      this.mass -= Math.max(0, spent);
      this.shedTimer += Math.max(0, spent);
      if (this.shedTimer >= 3) {
        const t = this.points[this.points.length - 1];
        game.addFood(t.x, t.y, Math.min(this.shedTimer, 8), true);
        this.shedTimer = 0;
      }
    }
    const target = this.segmentCount;
    while (this.points.length < target) {
      const t = this.points[this.points.length - 1] || this;
      this.points.push({ x: t.x, y: t.y });
    }
    if (this.points.length > target) this.points.length = target;
    const gap = this.spacing;
    this.points[0].x = this.x;
    this.points[0].y = this.y;
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i],
        q = this.points[i - 1],
        dx = q.x - p.x,
        dy = q.y - p.y,
        d = Math.hypot(dx, dy);
      if (d > gap) {
        p.x = q.x - (dx / d) * gap;
        p.y = q.y - (dy / d) * gap;
      }
    }
    this.displayBalance = S.lerp(
      this.displayBalance,
      this.balance,
      1 - Math.exp(-dt * 6),
    );
    if (Math.abs(this.displayBalance - this.balance) < 0.1)
      this.displayBalance = this.balance;
  }
};
