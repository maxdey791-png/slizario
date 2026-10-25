"use strict";
S.rewardFood = function (s, value) {
  s.mass = Math.min(6500, s.mass + value);
  if (S.config.balanceEnabled)
    s.balance = Math.min(
      1e15,
      s.balance + value * S.config.foodReward * S.config.balanceRate,
    );
};
S.rewardKill = function (killer, victim) {
  killer.kills++;
  if (S.config.balanceEnabled)
    killer.balance = Math.min(
      1e15,
      killer.balance +
        (S.config.killReward + victim.balance * S.config.transferShare) *
          S.config.balanceRate,
    );
};
S.canCashOut = (game) =>
  !!(
    game.started &&
    game.player?.alive &&
    S.config.balanceEnabled &&
    S.config.cashEnabled &&
    game.player.balance >= S.config.cashMin
  );
