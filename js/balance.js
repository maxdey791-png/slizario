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
    !game.roundEnded &&
    game.player?.alive &&
    S.config.balanceEnabled &&
    S.config.cashEnabled &&
    game.player.balance >= S.config.cashMin
  );

// Progress is measured from the opening balance of this round, not from zero.
S.cashProgress = (game) => {
  const start = game.roundStartBalance,
    goal = S.config.cashMin;
  if (goal <= start) return game.player.balance >= goal ? 1 : 0;
  return S.clamp((game.player.balance - start) / (goal - start), 0, 1);
};
