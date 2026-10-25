"use strict";
S.SpatialGrid = class {
  constructor(size = 100) {
    this.size = size;
    this.cells = new Map();
  }
  key(x, y) {
    return Math.floor(x / this.size) + "," + Math.floor(y / this.size);
  }
  clear() {
    this.cells.clear();
  }
  insert(item, x = item.x, y = item.y) {
    const k = this.key(x, y);
    let a = this.cells.get(k);
    if (!a) this.cells.set(k, (a = []));
    a.push(item);
  }
  query(x, y, r) {
    const out = [],
      z = this.size;
    for (let a = Math.floor((x - r) / z); a <= Math.floor((x + r) / z); a++)
      for (let b = Math.floor((y - r) / z); b <= Math.floor((y + r) / z); b++) {
        const cell = this.cells.get(a + "," + b);
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
