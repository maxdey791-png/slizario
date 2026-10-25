"use strict";
window.S = {};
S.schema = {
  Игра: [
    [
      "mode",
      "Игровой режим",
      [
        ["immortal", "Бессмертие"],
        ["normal", "Обычный"],
      ],
      "immortal",
    ],
    ["playerName", "Имя игрока", "text", "Вы"],
    ["foodCount", "Частицы на карте", "range", 1600, 400, 4000, 100],
    ["worldRadius", "Радиус арены", "range", 2600, 1400, 5000, 100],
    ["recordBalances", "Балансы в режиме записи", "bool", true],
    ["recordCursor", "Скрывать курсор при записи", "bool", true],
    ["recordFixedZoom", "Фиксировать масштаб при записи", "bool", true],
    ["recordEffects", "Эффекты в режиме записи", "bool", true],
  ],
  Змейки: [
    ["startMass", "Стартовая масса игрока", "range", 240, 60, 3000, 20],
    ["speed", "Базовая скорость", "range", 150, 70, 260, 5],
    ["boostMultiplier", "Множитель ускорения", "range", 1.9, 1.1, 3, 0.1],
    ["boostCost", "Расход массы в секунду", "range", 12, 0, 60, 1],
    ["massDrain", "Расходовать массу", "bool", true],
    ["infiniteBoost", "Бесконечное ускорение", "bool", false],
    ["doubleBoost", "Ускорение двойным кликом", "bool", true],
    [
      "doubleBoostSeconds",
      "Длительность двойного ускорения, с",
      "range",
      2.5,
      0.5,
      8,
      0.5,
    ],
  ],
  Боты: [
    ["botCount", "Количество ботов", "range", 24, 0, 80, 1],
    [
      "difficulty",
      "Сложность",
      [
        [1, "Очень лёгкий"],
        [2, "Лёгкий"],
        [3, "Средний"],
        [4, "Сложный"],
        [5, "Эксперт"],
      ],
      3,
    ],
    ["botReaction", "Скорость реакции", "range", 1, 0.3, 3, 0.1],
    ["botAggression", "Агрессивность", "range", 0.55, 0, 1, 0.05],
    ["botErrors", "Частота ошибок", "range", 0.15, 0, 0.8, 0.05],
    ["botBoost", "Частота ускорения", "range", 0.35, 0, 1, 0.05],
    ["botMass", "Начальная масса", "range", 350, 60, 2400, 10],
    ["botBalance", "Начальный баланс", "number", 800, 0, 1000000000, 50],
    ["largeBotChance", "Вероятность крупных ботов", "range", 0.2, 0, 1, 0.05],
  ],
  Баланс: [
    ["balanceEnabled", "Включить виртуальный баланс", "bool", true],
    [
      "startBalance",
      "Стартовый баланс игрока",
      "number",
      1000,
      0,
      1000000000000,
      100,
    ],
    ["balanceRate", "Множитель всех начислений", "range", 1, 0, 10, 0.1],
    ["foodReward", "Награда за единицу еды", "number", 2, 0, 1000000, 1],
    ["killReward", "Бонус за уничтожение", "number", 250, 0, 1000000000, 50],
    ["transferShare", "Доля баланса соперника", "range", 1, 0, 1, 0.05],
    ["cashEnabled", "Включить Cash Out", "bool", true],
    ["cashMin", "Минимальный Cash Out", "number", 5000, 0, 1000000000000, 100],
    ["cashContinue", "Продолжать игру после Cash Out", "bool", true],
    ["cashReset", "Обнулять баланс после Cash Out", "bool", true],
  ],
  Валюта: [
    [
      "currency",
      "Валюта",
      [
        ["USD", "USD · $"],
        ["EUR", "EUR · €"],
        ["RUB", "RUB · ₽"],
        ["PHP", "PHP · ₱"],
        ["THB", "THB · ฿"],
        ["IDR", "IDR · Rp"],
        ["VND", "VND · ₫"],
        ["CUSTOM", "Свой символ"],
      ],
      "USD",
    ],
    ["currencySymbol", "Собственный символ", "text", "★"],
    ["showCurrency", "Показывать символ валюты", "bool", true],
  ],
  Карты: [
    [
      "theme",
      "Тема",
      [
        ["neon", "Neon Arena"],
        ["galaxy", "Galaxy"],
        ["lava", "Lava World"],
        ["candy", "Candy Land"],
        ["cyber", "Cyber City"],
        ["classic", "Classic Pro"],
      ],
      "neon",
    ],
    ["brightness", "Яркость", "range", 1, 0.4, 1.5, 0.05],
    ["effects", "Интенсивность эффектов", "range", 0.7, 0, 1, 0.05],
  ],
  Камера: [
    ["autoZoom", "Автомасштабирование", "bool", true],
    ["zoom", "Масштаб", "range", 1, 0.25, 2, 0.05],
    ["minZoom", "Минимальный масштаб", "range", 0.4, 0.25, 1, 0.05],
    ["maxZoom", "Максимальный масштаб", "range", 1.5, 1, 2, 0.05],
    ["cameraSmooth", "Плавность следования", "range", 5, 1, 15, 0.5],
  ],
  Графика: [
    [
      "quality",
      "Качество",
      [
        ["low", "Экономичное"],
        ["medium", "Сбалансированное"],
        ["high", "Высокое"],
      ],
      "high",
    ],
    ["glow", "Свечение", "bool", true],
    ["showNames", "Имена над змейками", "bool", true],
    ["showBotBalances", "Балансы ботов", "bool", true],
    ["showMinimap", "Мини-карта", "bool", true],
    ["showFps", "Счётчик FPS", "bool", true],
    ["showParticles", "Эффекты распада", "bool", true],
  ],
  Автопилот: [
    ["autopilot", "Управлять автоматически", "bool", false],
    [
      "autoStyle",
      "Стиль",
      [
        ["calm", "Спокойный"],
        ["balanced", "Сбалансированный"],
        ["aggressive", "Агрессивный"],
      ],
      "balanced",
    ],
    ["autoBoost", "Использовать ускорение", "bool", true],
    ["autoSafety", "Дистанция безопасности", "range", 1, 0.5, 2, 0.1],
  ],
};
S.defaults = { skin: "lime" };
Object.values(S.schema)
  .flat()
  .forEach((f) => (S.defaults[f[0]] = f[3]));
S.sanitize = function (raw) {
  const out = { ...S.defaults };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const f of Object.values(S.schema).flat()) {
    const [k, , t, d, min, max] = f,
      v = raw[k];
    if (v === undefined) continue;
    if (t === "bool") out[k] = typeof v === "boolean" ? v : d;
    else if (t === "text") out[k] = typeof v === "string" ? v.slice(0, 24) : d;
    else if (Array.isArray(t)) out[k] = t.some((o) => o[0] === v) ? v : d;
    else
      out[k] =
        typeof v === "number" && Number.isFinite(v)
          ? Math.min(max, Math.max(min, v))
          : d;
  }
  if (
    typeof raw.skin === "string" &&
    /^(lime|ocean|coral|violet|gold|ice|flag-[a-z]{2})$/.test(raw.skin)
  )
    out.skin = raw.skin;
  if (out.maxZoom < out.minZoom) out.maxZoom = out.minZoom;
  return out;
};
S.storageOK = true;
S.readStorage = function (k, fallback) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch (e) {
    return fallback;
  }
};
S.config = S.sanitize(S.readStorage("slizario.config", {}));
S.listeners = [];
S.save = function () {
  try {
    localStorage.setItem("slizario.config", JSON.stringify(S.config));
    S.storageOK = true;
  } catch (e) {
    S.storageOK = false;
  }
};
S.change = function (key, value) {
  const old = S.config;
  S.config = S.sanitize({ ...old, [key]: value });
  S.save();
  S.listeners.forEach((fn) => fn(key, old));
};
S.replace = function (raw) {
  const old = S.config;
  S.config = S.sanitize(raw);
  S.save();
  S.listeners.forEach((fn) => fn("*", old));
};
S.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
S.lerp = (a, b, t) => a + (b - a) * t;
S.rand = (a, b) => a + Math.random() * (b - a);
S.angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
S.numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
S.compactFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});
S.format = function (value, compact = false) {
  const c = S.config;
  const symbols = {
    USD: "$",
    EUR: "€",
    RUB: "₽",
    PHP: "₱",
    THB: "฿",
    IDR: "Rp",
    VND: "₫",
    CUSTOM: c.currencySymbol,
  };
  let n = Math.max(0, Number(value) || 0);
  const str = (compact ? S.compactFormat : S.numberFormat).format(n);
  return (c.showCurrency ? symbols[c.currency] + "" : "") + str;
};
