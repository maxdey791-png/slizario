"use strict";
S.botNames = [
  "NOVA",
  "Космос",
  "Mango",
  "Viper",
  "Pixel",
  "Туман",
  "KIRA",
  "Zen",
  "Orion",
  "Лис",
  "Sakura",
  "Rex",
  "Ghost",
  "Луна",
  "Atlas",
  "Neo",
  "Kiwi",
  "Echo",
  "Blaze",
  "Mika",
  "Альфа",
  "Comet",
  "Vega",
  "Storm",
  "Lotus",
  "Turbo",
  "Boba",
  "Ninja",
  "Flare",
  "Onyx",
];
S.driveAI = function (s, game, dt) {
  const c = S.config,
    d = s.player ? 4 : Number(c.difficulty);
  s.thinkTimer -= dt;
  if (s.thinkTimer > 0) return;
  s.thinkTimer =
    ((s.player ? 0.1 : 0.32 - 0.045 * d) / c.botReaction) * S.rand(0.8, 1.2);
  const style = s.player ? c.autoStyle : "bot",
    aggression = s.player
      ? style === "calm"
        ? 0.03
        : style === "aggressive"
          ? 0.95
          : 0.5
      : (c.botAggression * (d - 1)) / 4;
  const safety = s.player ? c.autoSafety : 0.5 + d * 0.16;
  const error = s.player ? 0.005 : c.botErrors * (1.3 - d * 0.2);
  let vx = 0,
    vy = 0;
  let danger = 0;
  const ahead = 90 + (s.boost ? 80 : 0),
    px = s.x + Math.cos(s.angle) * ahead,
    py = s.y + Math.sin(s.angle) * ahead;
  const near = game.bodyGrid.query(px, py, 135 * safety + s.radius);
  for (const b of near) {
    if (b.snake === s || !b.snake.alive) continue;
    const dx = px - b.x,
      dy = py - b.y,
      dist = Math.hypot(dx, dy),
      safe = (b.radius + s.radius + 42) * safety;
    if (dist < safe) {
      const force = (safe - dist) / safe;
      vx += (dx / Math.max(1, dist)) * force * 6;
      vy += (dy / Math.max(1, dist)) * force * 6;
      danger = Math.max(danger, force);
    }
  }
  const wallDist = c.worldRadius - Math.hypot(s.x, s.y);
  if (wallDist < 280) {
    const a = Math.atan2(-s.y, -s.x);
    const force = (280 - wallDist) / 65;
    vx += Math.cos(a) * force;
    vy += Math.sin(a) * force;
    danger = Math.max(danger, 1 - wallDist / 280);
  }
  let target = null;
  const opponents = game.snakes.filter((o) => o !== s && o.alive);
  let enemy = null,
    enemyScore = 0;
  if (aggression > 0.05)
    for (const o of opponents) {
      const dist = Math.hypot(o.x - s.x, o.y - s.y);
      if (dist < 650 && dist > 65) {
        const score =
          ((o.mass < s.mass * 1.8 ? 1 : 0.35) * (o.balance * 0.002 + 30)) /
          (dist + 80);
        if (score > enemyScore) {
          enemyScore = score;
          enemy = o;
        }
      }
    }
  if (enemy && S.hash(s.id, Math.floor(game.time / 4)) < aggression) {
    const dist = Math.hypot(enemy.x - s.x, enemy.y - s.y),
      lead = S.clamp(dist / c.speed, 0, 1.6) * (d / 4);
    const predict = {
      x: enemy.x + Math.cos(enemy.angle) * c.speed * lead,
      y: enemy.y + Math.sin(enemy.angle) * c.speed * lead,
    };
    if (
      s.mass > enemy.mass * 1.5 &&
      dist < 260 &&
      s.points.length * s.spacing > dist * 4
    ) {
      const orbit =
        Math.atan2(s.y - enemy.y, s.x - enemy.x) + (s.id % 2 ? 1 : -1) * 0.9;
      const r = S.clamp(dist * 0.94, 90, 230);
      target = {
        x: enemy.x + Math.cos(orbit) * r,
        y: enemy.y + Math.sin(orbit) * r,
      };
      s.aiMode = "encircle";
    } else {
      target = predict;
      s.aiMode = "hunt";
    }
  } else {
    const food = game.foodGrid.query(s.x, s.y, 650);
    let best = Infinity;
    for (const f of food) {
      if (f.eaten) continue;
      const dx = f.x - s.x,
        dy = f.y - s.y,
        dist2 = dx * dx + dy * dy,
        angle = Math.abs(S.angleDiff(Math.atan2(dy, dx), s.angle));
      const score =
        ((dist2 + 2000) * (1 + angle * 0.45)) / (Math.sqrt(f.value) + 0.5);
      if (score < best) {
        best = score;
        target = f;
      }
    }
    s.aiMode = "forage";
  }
  if (!target) {
    const a = game.time * 0.13 + s.id * 2.4;
    target = {
      x: Math.cos(a) * c.worldRadius * 0.6,
      y: Math.sin(a) * c.worldRadius * 0.6,
    };
  }
  s.aiTarget = { x: target.x, y: target.y };
  const a = Math.atan2(target.y - s.y, target.x - s.x);
  vx += Math.cos(a);
  vy += Math.sin(a);
  let heading = Math.atan2(vy, vx);
  if (Math.random() < error) heading += S.rand(-1.6, 1.6);
  s.targetAngle = heading;
  const boostChance = s.player
    ? c.autoBoost
      ? style === "aggressive"
        ? 0.8
        : style === "balanced"
          ? 0.4
          : 0.08
      : 0
    : c.botBoost * (d / 4);
  const targetDist = Math.hypot(target.x - s.x, target.y - s.y);
  s.boost =
    danger < 0.2 &&
    Math.abs(S.angleDiff(heading, s.angle)) < 0.45 &&
    targetDist > 120 &&
    s.mass > 100 &&
    S.hash(s.id + 7, Math.floor(game.time * 1.5)) < boostChance;
};
