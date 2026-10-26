"use strict";
S.themes = {
  neon: {
    name: "Neon Arena",
    bg: "#090f1b",
    grid: "#1c3049",
    accent: "#86f5d1",
    food: ["#b5f76b", "#64dfe5", "#da86ff", "#ffc06e"],
    decor: "hex",
  },
  galaxy: {
    name: "Galaxy",
    bg: "#0d091e",
    grid: "#28213e",
    accent: "#b6a0ff",
    food: ["#caa4ff", "#82bdff", "#ffe7a0", "#ff8bc7"],
    decor: "stars",
  },
  lava: {
    name: "Lava World",
    bg: "#1a0e12",
    grid: "#442025",
    accent: "#ff9955",
    food: ["#ff8844", "#ffd76c", "#ff544f", "#f8b16a"],
    decor: "lava",
  },
  candy: {
    name: "Candy Land",
    bg: "#271e35",
    grid: "#4f365d",
    accent: "#ffb6de",
    food: ["#ffa0d5", "#7fe8e0", "#fce48e", "#c5adff"],
    decor: "candy",
  },
  cyber: {
    name: "Cyber City",
    bg: "#07191c",
    grid: "#123d42",
    accent: "#4df8e6",
    food: ["#52f9d8", "#7caaff", "#f0ff9b", "#e67cff"],
    decor: "city",
  },
  classic: {
    name: "Classic Pro",
    bg: "#151a20",
    grid: "#242d36",
    accent: "#a9c4be",
    food: ["#b4e487", "#80c6dd", "#de9cbd", "#e9ce89"],
    decor: "dots",
  },
};
S.hash = function (x, y) {
  let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

// New worlds share only placement; each has its own geometry, materials and particles.
Object.assign(S.themes, {
  volcano: {
    name: "Lava Volcano",
    bg: "#180e12",
    grid: "#4d2525",
    accent: "#ff9956",
    food: ["#ff783c", "#ffd06b", "#ffad3e", "#ff5250"],
    decor: "volcano",
  },
  clockwork: {
    name: "Vintage Clockwork",
    bg: "#181713",
    grid: "#393025",
    accent: "#d8b674",
    food: ["#f2cf82", "#e7b35c", "#c99b6a", "#fff0b7"],
    decor: "clockwork",
  },
  underwater: {
    name: "Underwater World",
    bg: "#071b2c",
    grid: "#153f53",
    accent: "#72e3dd",
    food: ["#74efe1", "#82caff", "#f2b2e9", "#b0f6a0"],
    decor: "underwater",
  },
  egypt: {
    name: "Ancient Egypt",
    bg: "#292217",
    grid: "#57452b",
    accent: "#ebc27a",
    food: ["#ffe19a", "#e9b354", "#79d9d0", "#f1c080"],
    decor: "egypt",
  },
  frozen: {
    name: "Frozen Kingdom",
    bg: "#102332",
    grid: "#284956",
    accent: "#b9efff",
    food: ["#b6f4ff", "#b6cbff", "#e5fbff", "#88dedc"],
    decor: "frozen",
  },
  jungle: {
    name: "Jungle Temple",
    bg: "#0c1d1a",
    grid: "#284237",
    accent: "#b3d58c",
    food: ["#c4ef89", "#ffd49a", "#7be1b0", "#f3ba86"],
    decor: "jungle",
  },
});
S.drawWorldDecor = function (ctx, t, b, fx) {
  const kinds = [
    "volcano",
    "clockwork",
    "underwater",
    "egypt",
    "frozen",
    "jungle",
  ];
  if (!kinds.includes(t.decor)) return;
  const ring = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  };
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Material grain and etched seams are static and rasterized only once per tile.
  ctx.fillStyle = t.grid + "45";
  for (let x = Math.floor(b.l / 48) * 48; x < b.r + 48; x += 48)
    for (let y = Math.floor(b.t / 48) * 48; y < b.b + 48; y += 48) {
      const n = S.hash(x, y);
      ctx.fillRect(x + n * 25, y + S.hash(y, x) * 25, 1 + n * 3, 1);
    }
  for (
    let ix = Math.floor((b.l - 180) / 320);
    ix <= Math.ceil((b.r + 180) / 320);
    ix++
  )
    for (
      let iy = Math.floor((b.t - 180) / 320);
      iy <= Math.ceil((b.b + 180) / 320);
      iy++
    ) {
      const n = S.hash(ix, iy),
        x = ix * 320 + 70 + n * 110,
        y = iy * 320 + 70 + S.hash(iy, ix) * 110;
      ctx.save();
      ctx.translate(x, y);
      if (t.decor === "volcano") {
        ctx.fillStyle = "#322025";
        ctx.beginPath();
        ctx.moveTo(-120, -90);
        ctx.lineTo(-20, -125);
        ctx.lineTo(92, -65);
        ctx.lineTo(115, 78);
        ctx.lineTo(20, 125);
        ctx.lineTo(-110, 50);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-160, -130);
        ctx.lineTo(-62, -65);
        ctx.lineTo(-30, -11);
        ctx.lineTo(15, 10);
        ctx.lineTo(-4, 68);
        ctx.lineTo(72, 150);
        ctx.strokeStyle = "#e8562220";
        ctx.lineWidth = 24;
        ctx.stroke();
        ctx.strokeStyle = "#f56a3640";
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.strokeStyle = "#ffb45766";
        ctx.lineWidth = 2;
        ctx.stroke();
        const g = ctx.createRadialGradient(40, -38, 2, 40, -38, 62);
        g.addColorStop(0, "#ffc36644");
        g.addColorStop(0.4, "#f45c2830");
        g.addColorStop(1, "#ec4e0000");
        ctx.fillStyle = g;
        ctx.fillRect(-24, -102, 128, 128);
        ctx.strokeStyle = "#ca552b44";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(40, -38, 34, 18, 0.2, 0, 7);
        ctx.stroke();
      } else if (t.decor === "clockwork") {
        const r = 50 + n * 29;
        ctx.rotate(n * 6);
        ctx.fillStyle = "#b18a3c15";
        ctx.strokeStyle = "#b89b5c44";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k < 64; k++) {
          const a = (k * Math.PI) / 32,
            rad = r * (k % 4 < 2 ? 1 : 0.86);
          const px = Math.cos(a) * rad,
            py = Math.sin(a) * rad;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ring(0, 0, r * 0.65);
        ring(0, 0, r * 0.19);
        for (let k = 0; k < 6; k++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath();
          ctx.moveTo(r * 0.22, 0);
          ctx.lineTo(r * 0.6, 0);
          ctx.stroke();
        }
        ctx.translate(100, 92);
        ctx.strokeStyle = "#e2bf7945";
        ring(0, 0, 39);
        ring(0, 0, 44);
        for (let k = 0; k < 12; k++) {
          const a = (k * Math.PI) / 6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 32, Math.sin(a) * 32);
          ctx.lineTo(Math.cos(a) * 36, Math.sin(a) * 36);
          ctx.stroke();
        }
        ctx.font = "10px Georgia,serif";
        ctx.fillStyle = "#e9cb8b66";
        ctx.fillText("XII", -8, -19);
        ctx.fillText("VI", -5, 28);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-11, -16);
        ctx.moveTo(0, 0);
        ctx.lineTo(22, -5);
        ctx.stroke();
      } else if (t.decor === "underwater") {
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 140);
        glow.addColorStop(0, "#268da51b");
        glow.addColorStop(1, "#267c9000");
        ctx.fillStyle = glow;
        ctx.fillRect(-140, -140, 280, 280);
        ctx.strokeStyle = "#2d92775c";
        ctx.lineWidth = 5;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(k * 18, 95);
          ctx.bezierCurveTo(k * 38, 40, k * 5, -12, k * 22, -55 - n * 25);
          ctx.stroke();
        }
        ctx.translate(90, 48);
        ctx.strokeStyle = "#b477a345";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 42);
        ctx.lineTo(0, -28);
        ctx.moveTo(0, 6);
        ctx.lineTo(-22, -13);
        ctx.lineTo(-26, -38);
        ctx.moveTo(0, -9);
        ctx.lineTo(23, -31);
        ctx.lineTo(26, -50);
        ctx.moveTo(-20, -13);
        ctx.lineTo(-42, -18);
        ctx.stroke();
      } else if (t.decor === "egypt") {
        ctx.fillStyle = "#d9a95712";
        ctx.strokeStyle = "#d9b46c33";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -74);
        ctx.lineTo(-95, 65);
        ctx.lineTo(95, 65);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e2bc6e16";
        ctx.beginPath();
        ctx.moveTo(0, -74);
        ctx.lineTo(10, 65);
        ctx.lineTo(95, 65);
        ctx.closePath();
        ctx.fill();
        for (let k = 0; k < 5; k++) {
          const yy = -35 + k * 22,
            w = (yy + 74) * 0.68;
          ctx.beginPath();
          ctx.moveTo(-w, yy);
          ctx.lineTo(w, yy);
          ctx.stroke();
        }
        ctx.strokeStyle = "#d7b46936";
        ctx.strokeRect(-120, 92, 240, 40);
        for (let k = -100; k < 110; k += 30) {
          ring(k, 107, 4);
          ctx.beginPath();
          ctx.moveTo(k, 111);
          ctx.lineTo(k, 124);
          ctx.moveTo(k - 6, 118);
          ctx.lineTo(k + 6, 118);
          ctx.stroke();
        }
      } else if (t.decor === "frozen") {
        ctx.strokeStyle = "#9ce4f32b";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-140, -70);
        ctx.lineTo(-30, 15);
        ctx.lineTo(-5, 100);
        ctx.moveTo(-30, 15);
        ctx.lineTo(70, -30);
        ctx.lineTo(140, -10);
        ctx.stroke();
        for (let k = 0; k < 3; k++) {
          const xx = (k - 1) * 30,
            yy = Math.abs(k - 1) * 15;
          ctx.fillStyle = ["#82cddd22", "#baeaff28", "#7eb5d42b"][k];
          ctx.strokeStyle = "#b5f0ff55";
          ctx.beginPath();
          ctx.moveTo(xx, yy - 70);
          ctx.lineTo(xx + 17, yy - 35);
          ctx.lineTo(xx + 12, yy + 14);
          ctx.lineTo(xx - 12, yy + 14);
          ctx.lineTo(xx - 17, yy - 35);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(xx, yy - 70);
          ctx.lineTo(xx, yy + 14);
          ctx.stroke();
        }
        ctx.strokeStyle = "#e2f7ff33";
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(90, 70);
          ctx.lineTo(90 + Math.cos(a) * 22, 70 + Math.sin(a) * 22);
          ctx.stroke();
        }
      } else if (t.decor === "jungle") {
        ctx.strokeStyle = "#7b997944";
        ctx.fillStyle = "#80978810";
        ctx.lineWidth = 2;
        ctx.fillRect(-64, -48, 128, 96);
        ctx.strokeRect(-64, -48, 128, 96);
        ctx.strokeRect(-48, -33, 96, 66);
        ctx.strokeRect(-28, -18, 56, 36);
        ctx.beginPath();
        ctx.moveTo(-64, 0);
        ctx.lineTo(-48, 0);
        ctx.moveTo(48, 0);
        ctx.lineTo(64, 0);
        ctx.stroke();
        ctx.strokeStyle = "#5a9b5f40";
        ctx.beginPath();
        ctx.moveTo(-112, -100);
        ctx.bezierCurveTo(-30, -50, -115, 55, -66, 120);
        ctx.stroke();
        for (let k = -2; k <= 2; k++) {
          ctx.save();
          ctx.translate(-95 + Math.sin(k) * 12, k * 40);
          ctx.rotate(k % 2 ? 0.8 : -0.8);
          ctx.fillStyle = "#55975a30";
          ctx.beginPath();
          ctx.ellipse(0, 0, 10, 28, 0, 0, 7);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    }
  ctx.restore();
};
S.drawAtmosphere = function (ctx, t, b, time, fx) {
  if (!fx) return;
  const kind = t.decor;
  if (
    ![
      "stars",
      "volcano",
      "underwater",
      "frozen",
      "jungle",
      "clockwork",
    ].includes(kind)
  )
    return;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = t.accent;
  ctx.fillStyle = t.accent;
  for (
    let ix = Math.floor((b.l - 100) / 210);
    ix <= Math.ceil((b.r + 100) / 210);
    ix++
  )
    for (
      let iy = Math.floor((b.t - 160) / 210);
      iy <= Math.ceil((b.b + 160) / 210);
      iy++
    ) {
      const n = S.hash(ix, iy),
        x = ix * 210 + n * 110,
        y = iy * 210 + S.hash(iy, ix) * 110;
      ctx.globalAlpha = (0.1 + n * 0.18) * fx;
      if (kind === "underwater") {
        const yy = y - ((time * 14 + n * 170) % 180);
        ctx.beginPath();
        ctx.arc(
          x + Math.sin(time * 0.6 + n * 7) * 8,
          yy,
          3 + n * 7,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      } else if (kind === "volcano") {
        ctx.globalAlpha *= 0.8;
        ctx.beginPath();
        ctx.ellipse(
          x + Math.sin(time + n * 4) * 10,
          y - ((time * 22 + n * 160) % 180),
          1 + n * 1.7,
          3 + n * 2,
          -0.3,
          0,
          7,
        );
        ctx.fill();
      } else if (kind === "frozen") {
        ctx.beginPath();
        ctx.arc(
          x + Math.sin(time * 0.4 + n * 6) * 12,
          y + ((time * 9 + n * 150) % 170),
          1 + n * 1.8,
          0,
          7,
        );
        ctx.fill();
      } else if (kind === "clockwork") {
        if (n < 0.8) continue;
        ctx.beginPath();
        ctx.arc(x, y, 12, time * 0.25, time * 0.25 + Math.PI * 1.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(time * 0.25) * 9,
          y + Math.sin(time * 0.25) * 9,
        );
        ctx.stroke();
      } else {
        ctx.globalAlpha *= 0.6 + 0.4 * Math.sin(time + n * 12);
        ctx.beginPath();
        ctx.arc(
          x,
          y + (kind === "jungle" ? Math.sin(time * 0.5 + n * 4) * 9 : 0),
          1.5 + n,
          0,
          7,
        );
        ctx.fill();
      }
    }
  ctx.restore();
};
