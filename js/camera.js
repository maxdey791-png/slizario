"use strict";
S.Camera = class {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.recordZoom = 1;
  }
  update(dt, player, recording) {
    const c = S.config;
    this.x = S.lerp(this.x, player.x, 1 - Math.exp(-dt * c.cameraSmooth));
    this.y = S.lerp(this.y, player.y, 1 - Math.exp(-dt * c.cameraSmooth));
    const z =
      recording && c.recordFixedZoom
        ? this.recordZoom
        : c.zoom *
          (c.autoZoom
            ? Math.max(0.48, 1 / Math.pow(player.mass / 240, 0.16))
            : 1);
    this.zoom = S.lerp(
      this.zoom,
      S.clamp(z, c.minZoom, c.maxZoom),
      1 - Math.exp(-dt * 2.8),
    );
  }
  screenToWorld(x, y, w, h) {
    return {
      x: (x - w / 2) / this.zoom + this.x,
      y: (y - h / 2) / this.zoom + this.y,
    };
  }
};
