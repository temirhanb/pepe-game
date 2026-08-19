// =============================================
// Редюсер покупки премиум-предмета
// =============================================

import { PREMIUM_ITEMS } from "../data/gameData.js";

/**
 * Покупка премиум-предмета за алмазы.
 * @param {object} state
 * @param {string} itemId
 * @returns {object}
 */
export const buyPremiumReducer = (state, itemId) => {
  const item = PREMIUM_ITEMS.find(i => i.id === itemId);
  if (!item) return state;
  if (state.diamonds < item.cost) return state;

  let newState = {...state, diamonds: state.diamonds - item.cost};

  if (item.timerField) {
    // Временный бафф — продлевает/устанавливает таймер
    newState[item.timerField] = item.duration;
  } else if (item.id === "talisman") {
    // Постоянное улучшение — увеличивает шанс
    newState.talismanCount = state.talismanCount + 1;
    newState.positiveChance = 0.05 + newState.talismanCount * 0.08;
  }

  return newState;
};