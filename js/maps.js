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
