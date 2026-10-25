"use strict";
S.Renderer = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.width = innerWidth;
    this.height = innerHeight;
    this.dpr = 1;
    this.sprites = new Map();
    this.resize();
  }
  resize() {
    this.width = innerWidth;
    this.height = innerHeight;
    this.dpr = Math.min(
      devicePixelRatio || 1,
      S.config.quality === "high" ? 2 : 1,
    );
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }
  sprite(color, glow) {
    const key = color + glow;
    let cv = this.sprites.get(key);
    if (cv) return cv;
    cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    const x = cv.getContext("2d");
    if (glow) {
      const g = x.createRadialGradient(32, 32, 1, 32, 32, 31);
      g.addColorStop(0, color);
      g.addColorStop(0.12, color + "ef");
      g.addColorStop(0.3, color + "50");
      g.addColorStop(1, color + "00");
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
    }
    x.fillStyle = color;
    x.beginPath();
    x.arc(32, 32, glow ? 5 : 12, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = "#fff9";
    x.beginPath();
    x.arc(30, 30, glow ? 2 : 4, 0, Math.PI * 2);
    x.fill();
    this.sprites.set(key, cv);
    return cv;
  }
  visible(x, y, pad = 80) {
    const b = this.bounds;
    return x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad;
  }
  render(game) {
    const ctx = this.ctx,
      c = S.config,
      theme = S.themes[c.theme],
      cam = game.camera,
      w = this.width,
      h = this.height,
      z = cam.zoom;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(z, z);
    ctx.translate(-cam.x, -cam.y);
    this.bounds = {
      l: cam.x - w / 2 / z,
      r: cam.x + w / 2 / z,
      t: cam.y - h / 2 / z,
      b: cam.y + h / 2 / z,
    };
    const fx = c.effects * (game.recording && !c.recordEffects ? 0 : 1);
    this.drawMap(ctx, theme, game.time, fx);
    const colors = theme.food;
    const glow = c.glow && c.quality !== "low" && fx > 0;
    for (const f of game.food) {
      if (f.eaten || !this.visible(f.x, f.y, 30)) continue;
      const color = colors[f.color % colors.length],
        radius = (2.5 + Math.sqrt(f.value) * 1.1) * (f.dropped ? 1.25 : 1);
      const size = glow ? radius * 7 : radius * 2.6;
      const pulse = 1 + Math.sin(game.time * 2 + f.phase) * 0.12 * fx;
      ctx.drawImage(
        this.sprite(color, glow),
        f.x - (size * pulse) / 2,
        f.y - (size * pulse) / 2,
        size * pulse,
        size * pulse,
      );
      if (c.theme === "candy" && f.value > 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(f.x - radius * 2, f.y - radius);
        ctx.lineTo(f.x + radius * 2, f.y + radius);
        ctx.stroke();
      }
    }
    const ordered = game.snakes
      .filter((s) => s.alive)
      .sort((a, b) => a.mass - b.mass);
    for (const s of ordered) {
      if (
        s.points.some(
          (p, i) => i % 8 === 0 && this.visible(p.x, p.y, s.radius * 3),
        )
      )
        this.drawSnake(ctx, s, game, fx);
    }
    if (c.showParticles && fx > 0) {
      for (const p of game.particles) {
        if (!this.visible(p.x, p.y)) continue;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size * p.life) / p.maxLife, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    for (const s of ordered)
      if (this.visible(s.x, s.y, 100)) this.drawLabel(ctx, s, game);
    ctx.restore();
    if (c.brightness !== 1) {
      ctx.fillStyle =
        c.brightness < 1
          ? "rgba(0,0,0," + (1 - c.brightness) + ")"
          : "rgba(220,235,255," + (c.brightness - 1) * 0.3 + ")";
      ctx.fillRect(0, 0, w, h);
    }
    const vignette = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.2,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.65,
    );
    vignette.addColorStop(0, "#00000000");
    vignette.addColorStop(1, "#02061066");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
  drawMap(ctx, t, time, fx) {
    const b = this.bounds;
    const step = t.decor === "city" ? 240 : 180;
    if (t.decor === "stars" && fx > 0) {
      const gx = Math.floor(b.l / 900),
        gy = Math.floor(b.t / 900);
      for (let x = gx; x <= Math.floor(b.r / 900); x++)
        for (let y = gy; y <= Math.floor(b.b / 900); y++) {
          const cx = x * 900 + 450,
            cy = y * 900 + 450,
            g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 600);
          g.addColorStop(0, S.hash(x, y) > 0.5 ? "#8a35bd15" : "#286ecb13");
          g.addColorStop(1, "#00000000");
          ctx.fillStyle = g;
          ctx.fillRect(cx - 600, cy - 600, 1200, 1200);
        }
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = t.grid;
    if (t.decor === "hex") {
      const a = 65;
      ctx.beginPath();
      for (
        let x = Math.floor(b.l / (a * 1.5)) - 1;
        x < Math.ceil(b.r / (a * 1.5)) + 1;
        x++
      )
        for (
          let y = Math.floor(b.t / (a * 1.732)) - 1;
          y < Math.ceil(b.b / (a * 1.732)) + 1;
          y++
        ) {
          const cx = x * a * 1.5,
            cy = y * a * 1.732 + (x % 2) * a * 0.866;
          for (let k = 0; k < 6; k++) {
            const angle = (k * Math.PI) / 3,
              px = cx + Math.cos(angle) * a,
              py = cy + Math.sin(angle) * a;
            k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath();
        }
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (t.decor === "city") {
      ctx.beginPath();
      for (let x = Math.floor(b.l / 80) * 80; x < b.r; x += 80) {
        ctx.moveTo(x, b.t);
        ctx.lineTo(x, b.b);
      }
      for (let y = Math.floor(b.t / 80) * 80; y < b.b; y += 80) {
        ctx.moveTo(b.l, y);
        ctx.lineTo(b.r, y);
      }
      ctx.stroke();
    }
    for (let x = Math.floor(b.l / step) - 1; x <= Math.ceil(b.r / step); x++)
      for (
        let y = Math.floor(b.t / step) - 1;
        y <= Math.ceil(b.b / step);
        y++
      ) {
        const rnd = S.hash(x, y),
          cx = x * step + rnd * 70,
          cy = y * step + S.hash(y, x) * 70;
        if (t.decor === "stars") {
          ctx.globalAlpha =
            (0.25 + rnd * 0.6) *
            (1 - fx * 0.2 + Math.sin(time * 0.8 + x + y) * fx * 0.2);
          ctx.fillStyle = "#d2d7ff";
          ctx.beginPath();
          ctx.arc(cx, cy, rnd * 1.8 + 0.4, 0, Math.PI * 2);
          ctx.fill();
          if (rnd > 0.93) {
            ctx.strokeStyle = "#a793d177";
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy);
            ctx.lineTo(cx + 5, cy);
            ctx.moveTo(cx, cy - 5);
            ctx.lineTo(cx, cy + 5);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        } else if (t.decor === "lava") {
          ctx.beginPath();
          ctx.moveTo(cx - 50, cy - 80);
          ctx.lineTo(cx - 8, cy - 20);
          ctx.lineTo(cx - 25, cy + 15);
          ctx.lineTo(cx + 40, cy + 75);
          ctx.strokeStyle = "#ff6933";
          ctx.lineWidth = 2 + rnd * 3;
          ctx.globalAlpha = 0.09 + fx * 0.11;
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "#ffb85e";
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#2e1a1e";
          ctx.beginPath();
          ctx.ellipse(cx + 30, cy - 30, 20 + rnd * 18, 12, 1, 0, 7);
          ctx.fill();
        } else if (t.decor === "candy") {
          ctx.globalAlpha = 0.12;
          ctx.strokeStyle = t.food[Math.floor(rnd * 4)];
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(cx, cy, 12 + rnd * 12, 0, 7);
          ctx.stroke();
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy + 20);
          ctx.lineTo(cx + 12, cy + 55);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (t.decor === "city" && rnd > 0.55) {
          ctx.globalAlpha = 0.2;
          ctx.strokeStyle = t.accent;
          ctx.strokeRect(cx, cy, 35 + rnd * 40, 55);
          ctx.fillStyle = t.accent;
          ctx.fillRect(cx + 8, cy + 12, 18, 2);
          ctx.fillRect(cx + 8, cy + 20, 27, 2);
          ctx.font = "9px monospace";
          ctx.fillText("0" + Math.floor(rnd * 99), cx + 8, cy + 43);
          ctx.globalAlpha = 1;
        } else if (t.decor === "dots") {
          ctx.fillStyle = t.grid;
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, 7);
          ctx.fill();
        } else if (t.decor === "hex" && rnd > 0.92) {
          ctx.strokeStyle = "#4a809333";
          ctx.beginPath();
          ctx.arc(cx, cy, 18, 0, 7);
          ctx.moveTo(cx - 26, cy);
          ctx.lineTo(cx + 26, cy);
          ctx.moveTo(cx, cy - 26);
          ctx.lineTo(cx, cy + 26);
          ctx.stroke();
        }
      }
    const r = S.config.worldRadius;
    ctx.strokeStyle = t.accent + "44";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = t.accent + "12";
    ctx.lineWidth = 28;
    ctx.stroke();
    ctx.lineWidth = 1;
  }
  path(ctx, s) {
    ctx.beginPath();
    const a = s.points;
    ctx.moveTo(a[a.length - 1].x, a[a.length - 1].y);
    for (let i = a.length - 2; i >= 0; i--) ctx.lineTo(a[i].x, a[i].y);
  }
  drawSnake(ctx, s, game, fx) {
    const p = s.points,
      r = s.radius,
      colors = S.skinColor(s.skin),
      boost = s.boostVisual;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (boost > 0.08 && fx > 0) {
      ctx.strokeStyle = colors[0];
      ctx.globalAlpha = boost * 0.13 * fx;
      ctx.lineWidth = r * 3.6;
      this.path(ctx, s);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = "#030912aa";
    ctx.lineWidth = r * 2 + 5;
    this.path(ctx, s);
    ctx.stroke();
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = r * 2;
    this.path(ctx, s);
    ctx.stroke();
    // Overlapping shaded scales keep the ribbon rounded without a per-segment shadow blur.
    for (let i = p.length - 1; i >= 0; i -= 2) {
      const q = p[i];
      if (!this.visible(q.x, q.y, r * 3)) continue;
      const taper = i > p.length - 7 ? Math.max(0.25, (p.length - i) / 7) : 1;
      ctx.fillStyle = colors[0];
      ctx.beginPath();
      ctx.arc(q.x, q.y, r * 0.89 * taper, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[1];
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(q.x, q.y + r * 0.37, r * 0.68 * taper, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const flag = S.getFlag(s.skin);
    if (flag) {
      for (let i = 3; i < p.length - 3; i += 7) {
        const q = p[i];
        if (!this.visible(q.x, q.y, r * 2)) continue;
        const prev = p[i - 2],
          angle = Math.atan2(prev.y - q.y, prev.x - q.x);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.roundRect(-r * 1.4, -r * 0.83, r * 2.8, r * 1.66, r * 0.65);
        ctx.clip();
        ctx.drawImage(flag, -r * 1.4, -r * 0.83, r * 2.8, r * 1.66);
        ctx.fillStyle = "#ffffff18";
        ctx.fillRect(-r * 1.4, -r * 0.83, r * 2.8, r * 0.4);
        ctx.restore();
      }
    }
    // The taper closes the tail; eyes turn with the head.
    const tail = p[p.length - 1];
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.arc(tail.x, tail.y, r * 0.3, 0, 7);
    ctx.fill();
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.13, r, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#ffffff29";
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, -r * 0.35, r * 0.6, r * 0.24, -0.2, 0, 7);
    ctx.fill();
    for (const side of [-1, 1]) {
      ctx.fillStyle = "#f5faff";
      ctx.beginPath();
      ctx.ellipse(
        r * 0.42,
        side * r * 0.56,
        r * 0.44,
        r * 0.38,
        0.1 * side,
        0,
        7,
      );
      ctx.fill();
      ctx.fillStyle = "#142132";
      ctx.beginPath();
      ctx.arc(r * 0.62, side * r * 0.56, r * 0.21, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(r * 0.66, side * r * 0.56 - r * 0.07, r * 0.065, 0, 7);
      ctx.fill();
    }
    ctx.restore();
    if (boost > 0.4 && fx > 0 && S.config.quality !== "low") {
      ctx.strokeStyle = colors[0];
      ctx.globalAlpha = 0.35 * boost;
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 3; i++) {
        const q = p[Math.min(p.length - 1, 7 + i * 8)];
        const offset = Math.sin(game.time * 12 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(
          q.x - Math.cos(s.angle) * 24 + offset,
          q.y - Math.sin(s.angle) * 24 - r * 1.7,
        );
        ctx.lineTo(q.x + offset, q.y - r * 1.7);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  drawLabel(ctx, s, game) {
    const c = S.config,
      z = game.camera.zoom,
      showBal =
        c.balanceEnabled &&
        (s.player || c.showBotBalances) &&
        (!game.recording || c.recordBalances),
      showName = c.showNames && !game.recording;
    if (!showBal && !showName) return;
    const x = s.x,
      y = s.y - s.radius - 17 / z;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 / z, 1 / z);
    ctx.textAlign = "center";
    if (showBal) {
      const text = S.format(s.displayBalance);
      ctx.font = "600 " + (s.player ? 16 : 12) + "px Segoe UI, Arial";
      const width = ctx.measureText(text).width + 20;
      ctx.fillStyle = s.player ? "#102322df" : "#08111dc4";
      ctx.strokeStyle = s.player ? "#b5f76b33" : "#ffffff12";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -22, width, 29, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = s.player ? "#d2ffa5" : "#e4edfa";
      ctx.fillText(text, 0, -3);
    }
    if (showName) {
      ctx.font = "10px Segoe UI, Arial";
      ctx.fillStyle = s.player ? "#b5f76b" : "#a2afc4";
      ctx.fillText(
        s.name + (s.player && c.autopilot ? " · AUTO" : ""),
        0,
        showBal ? -33 : -4,
      );
    }
    ctx.restore();
  }
  minimap(game) {
    const canvas = document.getElementById("minimap"),
      ctx = canvas.getContext("2d"),
      r = S.config.worldRadius,
      scale = 65 / r;
    ctx.clearRect(0, 0, 150, 150);
    ctx.fillStyle = "#0a1421";
    ctx.strokeStyle = "#25364a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(75, 75, 65, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(75, 75, 65, 0, 7);
    ctx.clip();
    ctx.strokeStyle = "#162438";
    ctx.beginPath();
    ctx.moveTo(10, 75);
    ctx.lineTo(140, 75);
    ctx.moveTo(75, 10);
    ctx.lineTo(75, 140);
    ctx.stroke();
    for (const s of game.snakes) {
      if (!s.alive) continue;
      ctx.fillStyle = s.player ? "#b5f76b" : "#738da6";
      ctx.beginPath();
      ctx.arc(75 + s.x * scale, 75 + s.y * scale, s.player ? 3.5 : 1.8, 0, 7);
      ctx.fill();
    }
    const cam = game.camera;
    ctx.strokeStyle = "#b5f76b30";
    ctx.strokeRect(
      75 + (cam.x - this.width / 2 / cam.zoom) * scale,
      75 + (cam.y - this.height / 2 / cam.zoom) * scale,
      (this.width / cam.zoom) * scale,
      (this.height / cam.zoom) * scale,
    );
    ctx.restore();
  }
};
