"use strict";
// Drawn from vector primitives: no generated images, remote textures or downloads.
Object.assign(S.themes, {
  arcade: {
    name: "Arcade Circuit",
    bg: "#101128",
    grid: "#343060",
    accent: "#ff85cb",
    food: ["#ff91ce", "#77eeef", "#ffe58d", "#b2a1ff"],
    decor: "arcade",
  },
  billiards: {
    name: "Billiard Club",
    bg: "#12372f",
    grid: "#285347",
    accent: "#e7d4a1",
    food: ["#ffe191", "#ffb599", "#9ee6d5", "#d5c4ff"],
    decor: "billiards",
  },
  paper: {
    name: "Paper Playground",
    bg: "#e6dfcb",
    grid: "#9eb7c3",
    accent: "#506777",
    food: ["#ce4371", "#168c9e", "#b27b22", "#6f55c8"],
    decor: "paper",
  },
  synthwave: {
    name: "Sunset Speedway",
    bg: "#1d102e",
    grid: "#653254",
    accent: "#ffad7c",
    food: ["#ffb788", "#f38ad4", "#9ce8e6", "#e5bfef"],
    decor: "synthwave",
  },
});
const drawOriginalDecor = S.drawWorldDecor;
S.drawWorldDecor = function (ctx, theme, bounds, fx) {
  if (!["arcade", "billiards", "paper", "synthwave"].includes(theme.decor))
    return drawOriginalDecor(ctx, theme, bounds, fx);
  const { l, r, t, b } = bounds;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (theme.decor === "paper") {
    ctx.strokeStyle = "#588eac26";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(l / 42) * 42; x < r; x += 42) {
      ctx.moveTo(x, t);
      ctx.lineTo(x, b);
    }
    for (let y = Math.floor(t / 42) * 42; y < b; y += 42) {
      ctx.moveTo(l, y);
      ctx.lineTo(r, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "#c3767230";
    ctx.beginPath();
    for (let x = Math.floor(l / 420) * 420 + 30; x < r; x += 420) {
      ctx.moveTo(x, t);
      ctx.lineTo(x, b);
    }
    ctx.stroke();
  } else if (theme.decor === "billiards") {
    // Fine, deterministic felt grain is baked into the existing tile cache.
    ctx.fillStyle = "#8bbf9f10";
    for (let x = Math.floor(l / 18) * 18; x < r; x += 18)
      for (let y = Math.floor(t / 18) * 18; y < b; y += 18) {
        const n = S.hash(x, y);
        ctx.fillRect(x + n * 10, y + S.hash(y, x) * 10, 1, 1 + n * 2);
      }
  }
  const cell = theme.decor === "paper" ? 420 : 560;
  for (
    let ix = Math.floor((l - 220) / cell);
    ix <= Math.ceil((r + 220) / cell);
    ix++
  )
    for (
      let iy = Math.floor((t - 220) / cell);
      iy <= Math.ceil((b + 220) / cell);
      iy++
    ) {
      const n = S.hash(ix, iy),
        x = ix * cell + cell / 2,
        y = iy * cell + cell / 2;
      ctx.save();
      ctx.translate(x, y);
      if (theme.decor === "arcade") {
        ctx.strokeStyle = "#5de9f32a";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.roundRect(-180, -180, 360, 360, 50);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff72c443";
        ctx.beginPath();
        ctx.roundRect(-170, -170, 340, 340, 44);
        ctx.stroke();
        for (const [bx, by, rad] of [
          [-82, -70, 31],
          [83, -38, 24],
          [0, 90, 36],
        ]) {
          ctx.fillStyle = "#dd86ff10";
          ctx.beginPath();
          ctx.arc(bx, by, rad, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#ddb0ff42";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(bx, by, rad * 0.64, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(bx - 8, by);
          ctx.lineTo(bx + 8, by);
          ctx.moveTo(bx, by - 8);
          ctx.lineTo(bx, by + 8);
          ctx.stroke();
        }
        ctx.strokeStyle = "#ffcf7544";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-120, 130);
        ctx.lineTo(-64, 112);
        ctx.moveTo(120, 130);
        ctx.lineTo(64, 112);
        ctx.stroke();
        for (let k = -3; k <= 3; k++) {
          ctx.fillStyle = "#b0eff52c";
          ctx.beginPath();
          ctx.arc(k * 32, -151, 3, 0, 7);
          ctx.fill();
        }
      } else if (theme.decor === "billiards") {
        ctx.rotate(n * 0.6 - 0.3);
        ctx.strokeStyle = "#ba9b5a28";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.roundRect(-205, -175, 410, 350, 35);
        ctx.stroke();
        ctx.fillStyle = "#081f1c45";
        for (const [px, py] of [
          [-185, -155],
          [185, -155],
          [-185, 155],
          [185, 155],
          [0, -167],
          [0, 167],
        ]) {
          ctx.beginPath();
          ctx.arc(px, py, 13, 0, 7);
          ctx.fill();
        }
        const colors = ["#d7b259", "#b37c66", "#7ca998"];
        for (let k = 0; k < 3; k++) {
          const xx = -70 + k * 66,
            yy = -15 + (k % 2) * 38;
          const g = ctx.createRadialGradient(xx - 6, yy - 8, 2, xx, yy, 25);
          g.addColorStop(0, colors[k] + "44");
          g.addColorStop(1, colors[k] + "15");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(xx, yy, 24, 0, 7);
          ctx.fill();
          ctx.strokeStyle = "#dce5c525";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = "#efe8d33b";
          ctx.beginPath();
          ctx.arc(xx, yy, 9, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#16322966";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.fillText(String(k + 1 + Math.floor(n * 5)), xx, yy + 3);
        }
        ctx.strokeStyle = "#d8c6a63b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-124, 116);
        ctx.lineTo(98, 71);
        ctx.stroke();
        ctx.strokeStyle = "#7297a95c";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(98, 71);
        ctx.lineTo(105, 69);
        ctx.stroke();
        ctx.fillStyle = "#7297a925";
        ctx.fillRect(135, 98, 18, 18);
        ctx.strokeStyle = "#9fbbba33";
        ctx.strokeRect(139, 102, 10, 10);
      } else if (theme.decor === "paper") {
        ctx.rotate(n * 0.3 - 0.15);
        ctx.strokeStyle = "#526b7e66";
        ctx.lineWidth = 1.8;
        // Pencil-like double lines, a paper plane, a spiral and a taped sketch.
        ctx.beginPath();
        ctx.moveTo(-75, -45);
        ctx.lineTo(54, -4);
        ctx.lineTo(-39, 26);
        ctx.lineTo(-25, -7);
        ctx.lineTo(-75, -45);
        ctx.moveTo(-25, -7);
        ctx.lineTo(54, -4);
        ctx.moveTo(-39, 26);
        ctx.lineTo(-28, 3);
        ctx.stroke();
        ctx.strokeStyle = "#ab777440";
        ctx.beginPath();
        for (let k = 0; k <= 65; k++) {
          const a = k * 0.25,
            rad = 2 + k * 0.45,
            px = 95 + Math.cos(a) * rad,
            py = 90 + Math.sin(a) * rad;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.strokeStyle = "#6f85975c";
        ctx.beginPath();
        for (let k = 0; k <= 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5,
            rad = k % 2 ? 10 : 24,
            px = -105 + Math.cos(a) * rad,
            py = 90 + Math.sin(a) * rad;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.fillStyle = "#cebca54a";
        ctx.save();
        ctx.rotate(-0.2);
        ctx.fillRect(28, -115, 47, 12);
        ctx.restore();
        ctx.strokeStyle = "#62868e42";
        ctx.strokeRect(25, -120, 100, 65);
        ctx.beginPath();
        ctx.moveTo(36, -70);
        ctx.lineTo(61, -94);
        ctx.lineTo(78, -77);
        ctx.lineTo(96, -101);
        ctx.lineTo(115, -70);
        ctx.stroke();
      } else {
        // Strip-cut sunset disc, road markings and geometric palm silhouettes.
        const g = ctx.createLinearGradient(0, -115, 0, 25);
        g.addColorStop(0, "#ffcd7335");
        g.addColorStop(1, "#e87dab12");
        ctx.fillStyle = g;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, -48, 78, 0, 7);
        ctx.clip();
        for (let k = 0; k < 13; k++)
          ctx.fillRect(
            -85,
            -126 + k * 13,
            170,
            k < 5 ? 13 : Math.max(3, 13 - (k - 4)),
          );
        ctx.restore();
        ctx.strokeStyle = "#fa8dbb30";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-170, 178);
        ctx.lineTo(-55, 30);
        ctx.lineTo(55, 30);
        ctx.lineTo(170, 178);
        ctx.stroke();
        ctx.strokeStyle = "#edc2c92c";
        ctx.setLineDash([12, 18]);
        ctx.beginPath();
        ctx.moveTo(0, 45);
        ctx.lineTo(0, 178);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "#ac8bb33d";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-146, 95);
        ctx.quadraticCurveTo(-133, 8, -144, -52);
        ctx.stroke();
        ctx.lineWidth = 2;
        for (let k = 0; k < 6; k++) {
          const a = -2.8 + k * 0.65;
          ctx.beginPath();
          ctx.moveTo(-144, -52);
          ctx.quadraticCurveTo(
            -144 + Math.cos(a) * 30,
            -52 + Math.sin(a) * 30,
            -144 + Math.cos(a) * 62,
            -35 + Math.sin(a) * 35,
          );
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  ctx.restore();
};
const drawOriginalAtmosphere = S.drawAtmosphere;
S.drawAtmosphere = function (ctx, theme, bounds, time, fx) {
  drawOriginalAtmosphere(ctx, theme, bounds, time, fx);
  if (!fx || theme.decor !== "arcade") return;
  ctx.save();
  ctx.fillStyle = "#ffb8e8";
  ctx.globalAlpha = (0.12 + 0.08 * Math.sin(time * 3)) * fx;
  for (
    let x = Math.floor(bounds.l / 560) * 560 + 280;
    x < bounds.r + 560;
    x += 560
  )
    for (
      let y = Math.floor(bounds.t / 560) * 560 + 129;
      y < bounds.b + 560;
      y += 560
    ) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 7);
      ctx.fill();
    }
  ctx.restore();
};
