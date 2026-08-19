// =============================================
// Редюсер покупки алмазов (заглушка для реальных платежей)
// =============================================

/**
 * Добавляет алмазы в состояние.
 * @param {object} state
 * @param {number} amount
 * @returns {object}
 */
export const buyDiamondsReducer = (state, amount) => {
  return {...state, diamonds: state.diamonds + amount};
};
