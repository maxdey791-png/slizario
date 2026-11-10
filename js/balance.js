"use strict";
S.rewardFood = function (s, value, lootBalance = 0) {
  s.mass = Math.min(6500, s.mass + value);
  if (S.config.balanceEnabled)
    s.balance = Math.min(
      1e15,
      s.balance +
        (value * S.config.foodReward + lootBalance) * S.config.balanceRate,
    );
};
// A kill only updates statistics. Both mass and money require an actual pickup.
S.rewardKill = function (killer) {
  killer.kills++;
};
S.foodRadius = (food) =>
  (4.8 + Math.sqrt(food.value) * 1.6) * (food.dropped ? 1.2 : 1);
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
