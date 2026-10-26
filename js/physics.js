"use strict";
S.SpatialGrid = class {
  constructor(size = 100) {
    this.size = size;
    this.cells = new Map();
    this.active = [];
  }
  key(x, y) {
    return (
      (Math.floor(x / this.size) + 32768) * 65536 +
      Math.floor(y / this.size) +
      32768
    );
  }
  clear() {
    for (const bucket of this.active) {
      bucket.length = 0;
      bucket.active = false;
    }
    this.active.length = 0;
  }
  insert(item, x = item.x, y = item.y) {
    const k = this.key(x, y);
    let a = this.cells.get(k);
    if (!a) this.cells.set(k, (a = []));
    if (!a.active) {
      a.active = true;
      this.active.push(a);
    }
    a.push(item);
  }
  remove(item) {
    const bucket = this.cells.get(this.key(item.x, item.y));
    if (!bucket) return;
    const i = bucket.indexOf(item);
    if (i >= 0) {
      bucket[i] = bucket[bucket.length - 1];
      bucket.pop();
    }
  }
  query(x, y, r, out = []) {
    out.length = 0;
    const z = this.size;
    for (let a = Math.floor((x - r) / z); a <= Math.floor((x + r) / z); a++)
      for (let b = Math.floor((y - r) / z); b <= Math.floor((y + r) / z); b++) {
        const cell = this.cells.get((a + 32768) * 65536 + b + 32768);
        if (cell) for (const item of cell) out.push(item);
      }
    return out;
  }
};
S.distance2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
S.spawnPoint = function (game, avoidPlayer = false) {
  const radius = S.config.worldRadius;
  for (let i = 0; i < 35; i++) {
    const a = Math.random() * Math.PI * 2,
      r = Math.sqrt(Math.random()) * (radius - 180),
      p = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    if (avoidPlayer && game.player && S.distance2(p, game.player) < 600 ** 2)
      continue;
    const nearby = game.bodyGrid.query(p.x, p.y, 150);
    if (!nearby.some((b) => S.distance2(p, b) < 130 ** 2)) return p;
  }
  return { x: radius * 0.6, y: radius * 0.3 };
};
