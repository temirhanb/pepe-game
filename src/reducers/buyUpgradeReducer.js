// =============================================
// Редюсер покупки обычного улучшения
// =============================================

import { UPGRADES } from "../data/gameData.js";

/**
 * Покупка улучшения за лотосы.
 * Если уже куплено или не хватает средств — возвращает state без изменений.
 * @param {object} state
 * @param {string} upgradeId
 * @returns {object}
 */
export const buyUpgradeReducer = (state, upgradeId) => {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade || state.ownedUpgrades.includes(upgradeId)) return state;

  const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, state.ownedUpgrades.length));
  if (state.lotuses < cost) return state;

  let newState = {
    ...state,
    lotuses: state.lotuses - cost,
    ownedUpgrades: [...state.ownedUpgrades, upgradeId]
  };
  return upgrade.apply(newState);
};