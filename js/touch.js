"use strict";
// Independent captured pointers permit simultaneous steering and boost on Android/iOS.
S.bindTouch = function (game) {
  const pad = document.getElementById("joystick"),
    knob = document.getElementById("joystickKnob"),
    boost = document.getElementById("touchBoost");
  let steerId = null,
    boostId = null;
  const enabled = () =>
    game.started && !game.roundEnded && !game.paused && !game.menuOpen;
  function resetStick() {
    steerId = null;
    game.touchInput.active = false;
    knob.style.transform = "translate(0px,0px)";
    pad.classList.remove("engaged");
  }
  function resetBoost() {
    boostId = null;
    game.touchInput.boost = false;
    boost.classList.remove("engaged");
  }
  S.releaseTouch = () => {
    resetStick();
    resetBoost();
  };
  function move(e) {
    if (e.pointerId !== steerId) return;
    e.preventDefault();
    const box = pad.getBoundingClientRect(),
      dx = e.clientX - box.left - box.width / 2,
      dy = e.clientY - box.top - box.height / 2,
      d = Math.hypot(dx, dy),
      limit = box.width * 0.31,
      k = d > limit ? limit / d : 1;
    knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    game.touchInput.active = d > 6;
    if (d > 6) game.touchInput.angle = Math.atan2(dy, dx);
  }
  pad.addEventListener("pointerdown", (e) => {
    if (!enabled() || steerId !== null) return;
    e.preventDefault();
    steerId = e.pointerId;
    pad.setPointerCapture(steerId);
    pad.classList.add("engaged");
    game.pointer.active = false;
    move(e);
  });
  pad.addEventListener("pointermove", move);
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    pad.addEventListener(event, (e) => {
      if (e.pointerId === steerId) resetStick();
    });
  boost.addEventListener("pointerdown", (e) => {
    if (!enabled() || boostId !== null) return;
    e.preventDefault();
    boostId = e.pointerId;
    boost.setPointerCapture(boostId);
    game.touchInput.boost = true;
    boost.classList.add("engaged");
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    boost.addEventListener(event, (e) => {
      if (e.pointerId === boostId) resetBoost();
    });
};
