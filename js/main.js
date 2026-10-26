"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    game = new S.Game($("arena"));
  window.slizario = game;
  let toastTimer,
    activeTab = "Игра",
    restoreResult = false;
  let leaderSignature = "";
  S.bindTouch(game);
  S.toast = function (message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
  };
  const icons = ["◇", "◈", "⌘", "+", "＄", "▧", "⊕", "✧", "◎"];
  function node(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function refreshHUD() {
    const c = S.config,
      p = game.player;
    $("balanceValue").textContent = c.balanceEnabled
      ? S.format(p.displayBalance)
      : "—";
    $("balanceValue").style.fontSize =
      $("balanceValue").textContent.length > 18
        ? "17px"
        : $("balanceValue").textContent.length > 14
          ? "21px"
          : "";
    $("massValue").textContent = Math.floor(p.mass).toLocaleString("ru-RU");
    $("killsValue").textContent = p.kills;
    $("modeBadge").textContent =
      c.mode === "immortal" ? "БЕССМЕРТИЕ" : "ОБЫЧНЫЙ";
    $("modeBadge").style.color = c.mode === "immortal" ? "" : "#ff9e98";
    $("cashBtn").hidden = !c.cashEnabled || !c.balanceEnabled;
    $("cashProgress").parentElement.hidden =
      !c.cashEnabled || !c.balanceEnabled;
    $("cashBtn").disabled = !S.canCashOut(game);
    $("cashHint").textContent =
      p.balance < c.cashMin ? "от " + S.format(c.cashMin) : "доступен";
    const progress = S.cashProgress(game),
      percent = Math.round(progress * 100);
    $("cashProgress").style.width = percent + "%";
    $("cashGoal").hidden = !c.cashEnabled || !c.balanceEnabled;
    $("goalCurrent").textContent = S.format(p.balance);
    $("goalTarget").textContent = S.format(c.cashMin);
    $("goalFill").style.transform = "scaleX(" + progress + ")";
    $("goalPercent").textContent = percent + "%";
    $("goalTrack").setAttribute("aria-valuenow", percent);
    const sorted = game.snakes
      .filter((s) => s.alive)
      .sort((a, b) =>
        c.balanceEnabled ? b.balance - a.balance : b.mass - a.mass,
      );
    $("rankValue").textContent = "#" + Math.max(1, sorted.indexOf(p) + 1);
    const leaders = sorted.slice(0, 5);
    if (p.alive && !leaders.includes(p) && leaders.length)
      leaders[leaders.length - 1] = p;
    const signature = leaders
      .map((s) =>
        [
          s.id,
          s.name,
          s.skin,
          sorted.indexOf(s),
          c.balanceEnabled
            ? S.format(s.displayBalance, true)
            : Math.floor(s.mass),
        ].join(":"),
      )
      .join("|");
    if (signature !== leaderSignature) {
      leaderSignature = signature;
      const frag = document.createDocumentFragment();
      for (const s of leaders) {
        const row = node("div", "leader-row" + (s.player ? " me" : ""));
        row.append(node("span", "leader-rank", sorted.indexOf(s) + 1));
        const dot = node("i", "leader-dot");
        dot.style.background = S.skinColor(s.skin)[0];
        row.append(
          dot,
          node("span", "leader-name", s.name),
          node(
            "span",
            "leader-money",
            c.balanceEnabled
              ? S.format(s.displayBalance, true)
              : Math.floor(s.mass),
          ),
        );
        frag.append(row);
      }
      $("leaderRows").replaceChildren(frag);
    }
    $("population").textContent = sorted.length + " змеек";
    $("fps").hidden = !c.showFps;
    $("fps").textContent = Math.round(game.fps) + " FPS";
    $("autoState").textContent = c.autopilot
      ? "ВКЛ · " +
        { calm: "СПОКОЙНЫЙ", balanced: "БАЛАНС", aggressive: "АТАКА" }[
          c.autoStyle
        ]
      : "ВЫКЛ";
    $("autoBtn").classList.toggle("active", c.autopilot);
    $("mapLabel").textContent = S.themes[c.theme].name.toUpperCase();
    $("zoomValue").textContent = Math.round(game.camera.zoom * 100) + "%";
    document.querySelector(".map-frame").hidden = !c.showMinimap;
    if (c.showMinimap && !game.recording) game.renderer.minimap(game);
    $("playerName").value = c.playerName;
    $("welcomeMode").textContent =
      c.mode === "immortal" ? "◇ Бессмертие" : "◇ Обычный режим";
    $("welcomeSkin").textContent = "◈ " + S.skinName(c.skin);
    $("pauseBtn").textContent = game.paused ? "▶" : "Ⅱ";
    $("pauseBtn").dataset.paused = String(game.paused);
    $("pauseBtn").title = game.paused ? "Продолжить · Space" : "Пауза · Space";
    document.body.classList.toggle("paused", game.paused);
  }
  game.onHUD = refreshHUD;
  function start() {
    S.releaseTouch();
    game.reset(true);
    $("welcome").hidden = true;
    $("resultOverlay").hidden = true;
    game.menuOpen = false;
    game.paused = false;
    $("settingsOverlay").hidden = true;
    S.toast(
      "Арена открыта · " +
        (S.config.autopilot ? "автопилот включён" : "двигайте курсором"),
    );
    refreshHUD();
  }
  function openSettings(tab) {
    if (tab) activeTab = tab;
    game.pointer.down = false;
    S.releaseTouch();
    restoreResult = !$("resultOverlay").hidden;
    $("resultOverlay").hidden = true;
    game.menuOpen = true;
    $("settingsOverlay").hidden = false;
    renderSettings();
  }
  function closeSettings() {
    $("settingsOverlay").hidden = true;
    game.menuOpen = false;
    if (restoreResult) {
      $("resultOverlay").hidden = false;
      restoreResult = false;
    }
    refreshHUD();
  }
  function makeControl(f) {
    const [key, label, type, , min, max, step] = f,
      c = S.config;
    const row = node("div", "setting-row");
    const lab = node("label", "setting-label", label);
    lab.htmlFor = "setting-" + key;
    const hints = {
      startMass: "Применяется при следующем входе на арену",
      startBalance: "Применяется при следующем входе на арену",
      botMass: "Для вновь появляющихся ботов",
      botBalance: "Для вновь появляющихся ботов",
      balanceEnabled: "Только виртуальные очки, без реальных денег",
      infiniteBoost: "Ускорение без потери массы, даже у маленькой змейки",
      recordFixedZoom: "Используется масштаб в момент включения режима V",
      doubleBoost: "Двойной клик даёт короткое ускорение",
      autoSafety: "Большое значение — более осторожное движение",
      quality: "Ограничивает плотность пикселей и эффекты",
    };
    if (hints[key]) lab.append(node("small", "", hints[key]));
    row.append(lab);
    let input;
    if (Array.isArray(type)) {
      input = node("select");
      for (const [value, text] of type) {
        const option = node("option", "", text);
        option.value = value;
        input.append(option);
      }
      input.value = c[key];
      input.addEventListener("change", () => {
        S.change(
          key,
          typeof type[0][0] === "number" ? Number(input.value) : input.value,
        );
      });
    } else {
      input = node("input");
      if (type === "bool") {
        input.type = "checkbox";
        input.className = "switch";
        input.checked = c[key];
        input.addEventListener("change", () => S.change(key, input.checked));
      } else if (type === "range") {
        input.type = "range";
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = c[key];
        const wrap = node("div", "range-wrap"),
          out = node("output", "", String(c[key]));
        out.htmlFor = "setting-" + key;
        input.addEventListener("input", () => {
          out.textContent = input.value;
          S.change(key, Number(input.value));
        });
        wrap.append(input, out);
        row.append(wrap);
      } else {
        input.type = type === "text" ? "text" : "number";
        if (type === "text") input.maxLength = 24;
        else {
          input.min = min;
          input.max = max;
          input.step = step;
        }
        input.value = c[key];
        input.addEventListener("change", () => {
          if (input.type === "number" && input.value.trim() === "") {
            input.value = S.config[key];
            return;
          }
          S.change(key, type === "text" ? input.value : Number(input.value));
          input.value = S.config[key];
        });
      }
    }
    input.id = "setting-" + key;
    if (type !== "range") row.append(input);
    return row;
  }
  function renderSettings() {
    const tabs = $("settingsTabs");
    tabs.replaceChildren();
    Object.keys(S.schema).forEach((name, i) => {
      const b = node("button", name === activeTab ? "active" : "");
      b.setAttribute("aria-current", name === activeTab ? "page" : "false");
      b.append(node("span", "", icons[i]), document.createTextNode(name));
      b.onclick = () => {
        activeTab = name;
        renderSettings();
      };
      tabs.append(b);
    });
    const content = $("settingsContent");
    content.replaceChildren(node("h3", "tab-heading", activeTab));
    const desc = {
      Игра: "Настройки применяются сразу. При открытой панели симуляция приостановлена.",
      Змейки: "Мягкие повороты, ускорение и внешний вид вашей змейки.",
      Боты: "Боты собирают еду, атакуют и сталкиваются друг с другом. Новые появляются автоматически.",
      Баланс:
        "Настройте виртуальную экономику арены. Реальных денежных операций нет.",
      Валюта: "Символ меняет только оформление виртуального баланса.",
      Карты:
        "Двенадцать миров с разным окружением и частицами. Переключайтесь прямо во время игры.",
      Камера:
        "Колёсико мыши меняет масштаб. Автомасштабирование учитывает рост змейки.",
      Графика:
        "Подберите качество под экран и производительность вашего устройства.",
      Автопилот:
        "A — быстрое переключение. ИИ ищет еду, перехватывает соперников и избегает опасности.",
    };
    content.append(node("div", "tab-description", desc[activeTab]));
    if (activeTab === "Карты") {
      const grid = node("div", "theme-grid");
      for (const [id, t] of Object.entries(S.themes)) {
        const b = node(
          "button",
          "theme-option" + (id === S.config.theme ? " selected" : ""),
          t.name,
        );
        b.setAttribute("aria-label", t.name);
        b.style.setProperty(
          "--theme",
          "linear-gradient(135deg," + t.grid + "," + t.bg + ")",
        );
        b.style.setProperty("--glow", t.accent);
        b.onclick = () => {
          S.change("theme", id);
          renderSettings();
        };
        grid.append(b);
      }
      content.append(grid);
    }
    for (const f of S.schema[activeTab])
      if (!(activeTab === "Карты" && f[0] === "theme"))
        content.append(makeControl(f));
    if (activeTab === "Змейки") renderSkins(content);
    if (activeTab === "Игра") renderPresets(content);
    if (activeTab === "Баланс")
      content.append(
        node(
          "div",
          "notice",
          "Cash Out завершает раунд. «Играть снова» возвращает стартовый размер и начальный виртуальный баланс.",
        ),
      );
    $("saveStatus").textContent = S.storageOK
      ? "✓ Сохраняется автоматически"
      : "Хранилище недоступно · используйте экспорт";
  }
  function renderSkins(parent) {
    parent.append(
      node("h3", "", "Скины · " + S.countryCodes.length + " флагов"),
    );
    const search = node("input", "skin-search");
    search.type = "text";
    search.placeholder = "Найти страну или цвет…";
    search.setAttribute("aria-label", "Поиск скина");
    parent.append(search);
    const grid = node("div", "skin-grid");
    parent.append(grid);
    function fill() {
      grid.replaceChildren();
      const ids = [
          ...Object.keys(S.skinColors),
          ...S.countryCodes.map((x) => "flag-" + x),
        ],
        query = search.value.toLocaleLowerCase("ru");
      let count = 0;
      for (const id of ids) {
        const name = S.skinName(id);
        if (
          query &&
          !name.toLocaleLowerCase("ru").includes(query) &&
          !id.includes(query)
        )
          continue;
        count++;
        const b = node(
          "button",
          "skin-option" + (S.config.skin === id ? " selected" : ""),
        );
        b.title = name;
        b.setAttribute("aria-label", name);
        if (id.startsWith("flag-")) {
          const img = node("img");
          img.src = "assets/flags/" + id.slice(5) + ".svg";
          img.alt = "";
          img.loading = "lazy";
          b.append(img);
        } else {
          const dot = node("span", "skin-color");
          dot.style.background = S.skinColors[id][0];
          b.append(dot);
        }
        b.append(document.createTextNode(name));
        b.onclick = () => {
          S.change("skin", id);
          fill();
        };
        grid.append(b);
      }
      if (!count) grid.append(node("p", "", "Страны не найдены"));
    }
    search.oninput = fill;
    fill();
  }
  function renderPresets(parent) {
    parent.append(node("h3", "", "Ваши пресеты"));
    const row = node("div", "preset-row"),
      name = node("input");
    name.type = "text";
    name.placeholder = "Название пресета";
    name.maxLength = 30;
    const save = node("button", "", "Сохранить");
    row.append(name, save);
    parent.append(row);
    const list = node("div", "preset-list");
    parent.append(list);
    function get() {
      const a = S.readStorage("slizario.presets", []);
      return Array.isArray(a)
        ? a
            .filter(
              (p) =>
                p &&
                typeof p.name === "string" &&
                p.config &&
                typeof p.config === "object",
            )
            .slice(0, 12)
        : [];
    }
    function store(a) {
      try {
        localStorage.setItem("slizario.presets", JSON.stringify(a));
        return true;
      } catch (e) {
        S.toast("Не удалось сохранить. Используйте экспорт JSON.");
        return false;
      }
    }
    function fill() {
      list.replaceChildren();
      get().forEach((p, i) => {
        const b = node("button", "", p.name.slice(0, 30));
        b.onclick = () => {
          S.replace(p.config);
          renderSettings();
          S.toast("Пресет применён");
        };
        const del = node("button", "", "×");
        del.title = "Удалить " + p.name;
        del.onclick = () => {
          const a = get();
          a.splice(i, 1);
          store(a);
          fill();
        };
        const group = node("span");
        group.append(b, del);
        list.append(group);
      });
    }
    save.onclick = () => {
      const n = name.value.trim();
      if (!n) {
        S.toast("Введите название пресета");
        return;
      }
      const a = get(),
        existing = a.findIndex((p) => p.name === n);
      if (existing >= 0) a[existing] = { name: n, config: { ...S.config } };
      else {
        if (a.length >= 12) {
          S.toast("Максимум 12 пресетов");
          return;
        }
        a.push({ name: n, config: { ...S.config } });
      }
      if (store(a)) {
        name.value = "";
        fill();
        S.toast("Пресет сохранён");
      }
    };
    fill();
  }
  function showResult(kind, amount, reason) {
    S.releaseTouch();
    game.paused = true;
    game.pointer.down = false;
    $("resultOverlay").hidden = false;
    const card = $("resultOverlay").querySelector("section");
    card.classList.toggle("cashout", kind === "cash");
    $("resultLabel").textContent =
      kind === "cash" ? "ВИРТУАЛЬНЫЙ CASH OUT" : "ИГРА ЗАВЕРШЕНА";
    $("resultTitle").textContent =
      kind === "cash" ? "Красивый выход." : "Вы стали сильнее.";
    $("resultAmount").textContent = S.config.balanceEnabled
      ? S.format(amount)
      : Math.floor(game.player.mass) + " массы";
    $("resultAmount").style.fontSize =
      $("resultAmount").textContent.length > 14 ? "27px" : "";
    $("resultStats").textContent =
      Math.floor(game.bestMass) +
      " макс. массы · " +
      game.player.kills +
      " побед · " +
      Math.floor(game.time / 60) +
      ":" +
      String(Math.floor(game.time % 60)).padStart(2, "0") +
      " на арене";
    $("resultNote").textContent =
      kind === "cash"
        ? "Виртуальный выигрыш получен. Раунд завершён. Новая игра начнётся со стартового размера и баланса."
        : reason || "Попробуйте другой маршрут или включите бессмертие.";
    $("restartBtn").textContent =
      kind === "cash" ? "Играть снова" : "Снова на арену";
    if (game.recording) {
      game.recording = false;
      document.body.classList.remove("recording", "hide-cursor");
      $("recordExit").hidden = true;
    }
  }
  game.onDeath = (p, reason) => {
    game.endRound();
    showResult("death", p.balance, reason);
  };
  $("cashBtn").onclick = () => {
    if (!S.canCashOut(game)) return;
    const amount = game.player.balance;
    game.totalCashed += amount;
    game.runCashed += amount;
    game.endRound();
    showResult("cash", amount);
    refreshHUD();
  };
  $("restartBtn").onclick = () => {
    start();
  };
  $("resultSettings").onclick = () => openSettings();
  $("playBtn").onclick = () => {
    S.change("playerName", $("playerName").value.trim() || "Вы");
    start();
  };
  $("playerName").addEventListener("input", () => {
    S.change("playerName", $("playerName").value);
  });
  $("welcomeMode").onclick = () =>
    S.change("mode", S.config.mode === "immortal" ? "normal" : "immortal");
  $("welcomeSkin").onclick = () => openSettings("Змейки");
  $("welcomeSettings").onclick = () => openSettings();
  $("settingsBtn").onclick = () => openSettings();
  $("brand").onclick = (e) => {
    e.preventDefault();
    openSettings("Игра");
  };
  $("closeSettings").onclick = closeSettings;
  $("settingsOverlay").addEventListener("click", (e) => {
    if (e.target === $("settingsOverlay")) closeSettings();
  });
  function pause() {
    if (
      !game.started ||
      !game.player.alive ||
      game.menuOpen ||
      !$("resultOverlay").hidden
    )
      return;
    game.paused = !game.paused;
    game.pointer.down = false;
    S.toast(
      game.paused ? "Пауза · Space для продолжения" : "Игра продолжается",
    );
    refreshHUD();
  }
  $("pauseBtn").onclick = pause;
  $("autoBtn").onclick = () => {
    S.change("autopilot", !S.config.autopilot);
    S.toast(S.config.autopilot ? "Автопилот включён" : "Ручное управление");
  };
  function recording() {
    if (
      !game.started ||
      !game.player.alive ||
      !$("resultOverlay").hidden ||
      restoreResult
    )
      return;
    if (!game.recording && game.menuOpen) closeSettings();
    game.recording = !game.recording;
    game.camera.recordZoom = game.camera.zoom;
    document.body.classList.toggle("recording", game.recording);
    document.body.classList.toggle("hide-cursor", S.config.recordCursor);
    $("recordExit").hidden = !game.recording;
    S.toast(
      game.recording
        ? "Чистый кадр · V — вернуть интерфейс"
        : "Интерфейс возвращён",
    );
  }
  $("recordBtn").onclick = recording;
  $("recordExit").querySelector("button").onclick = recording;
  function zoom(delta) {
    S.change(
      "zoom",
      S.clamp(S.config.zoom * delta, S.config.minZoom, S.config.maxZoom),
    );
    if (game.recording)
      game.camera.recordZoom = S.clamp(
        game.camera.recordZoom * delta,
        S.config.minZoom,
        S.config.maxZoom,
      );
  }
  $("zoomIn").onclick = () => zoom(1.12);
  $("zoomOut").onclick = () => zoom(1 / 1.12);
  $("arena").addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom(Math.exp(-e.deltaY * 0.001));
    },
    { passive: false },
  );
  $("arena").addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || game.touchInput.active) return;
    game.pointer.x = e.clientX;
    game.pointer.y = e.clientY;
    game.pointer.active = true;
  });
  $("arena").addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    game.pointer.x = e.clientX;
    game.pointer.y = e.clientY;
    game.pointer.active = true;
    game.pointer.down = true;
    $("arena").setPointerCapture(e.pointerId);
  });
  window.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "touch") game.pointer.down = false;
  });
  window.addEventListener("pointercancel", () => (game.pointer.down = false));
  window.addEventListener("blur", () => {
    S.releaseTouch();
    game.pointer.down = false;
    if (
      game.started &&
      game.player.alive &&
      !game.menuOpen &&
      $("resultOverlay").hidden
    ) {
      game.paused = true;
      refreshHUD();
    }
  });
  $("arena").addEventListener("dblclick", () => {
    if (S.config.doubleBoost)
      game.doubleUntil = game.time + S.config.doubleBoostSeconds;
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("settingsOverlay").hidden) closeSettings();
      else openSettings();
      return;
    }
    if (e.target.matches("input,select,textarea") || e.repeat) return;
    if (e.code === "KeyA") $("autoBtn").click();
    else if (e.code === "KeyV") recording();
    else if (e.code === "Space") {
      e.preventDefault();
      pause();
    }
  });
  window.addEventListener("resize", () => {
    S.releaseTouch();
    game.renderer.resize();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      S.releaseTouch();
      game.pointer.down = false;
      if (game.started && !game.roundEnded) game.paused = true;
    }
  });
  $("resetBtn").onclick = () => {
    S.replace(S.defaults);
    renderSettings();
    S.toast("Стандартные настройки восстановлены");
  };
  $("exportBtn").onclick = () => {
    const blob = new Blob(
        [JSON.stringify({ version: 1, settings: S.config }, null, 2)],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = node("a");
    a.href = url;
    a.download = "slizario-config.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    S.toast("Конфигурация экспортирована");
  };
  $("importBtn").onclick = () => $("importFile").click();
  $("importFile").onchange = async () => {
    const file = $("importFile").files[0];
    if (!file) return;
    try {
      if (file.size > 100000) throw Error("Слишком большой файл");
      const raw = JSON.parse(await file.text()),
        settings = raw.settings || raw;
      if (raw.version !== undefined && raw.version !== 1)
        throw Error("Неизвестная версия");
      if (
        !settings ||
        typeof settings !== "object" ||
        Array.isArray(settings) ||
        !Object.keys(S.defaults).some((k) => k in settings)
      )
        throw Error("Настройки не найдены");
      if (settings.skin && !S.validSkin(settings.skin))
        throw Error("Неизвестный скин");
      S.replace(settings);
      renderSettings();
      S.toast("Настройки импортированы");
    } catch (e) {
      S.toast("Ошибка импорта: " + e.message);
    }
    $("importFile").value = "";
  };
  S.listeners.push((key, old) => {
    if (!S.validSkin(S.config.skin)) S.config.skin = "lime";
    game.applySettings(key, old);
    document.body.classList.toggle("hide-cursor", S.config.recordCursor);
    refreshHUD();
  });
  refreshHUD();
  requestAnimationFrame((t) => game.frame(t));
})();
