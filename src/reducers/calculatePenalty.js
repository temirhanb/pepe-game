// =============================================
// Редюсер расчёта штрафа при клике
// =============================================

/**
 * Вычисляет размер штрафа в зависимости от типа.
 * @param {number} lotuses — текущее количество лотосов
 * @param {{type: string, value: number}} penalty — объект штрафа
 * @returns {number} — количество потерянных лотосов
 */
export const calculatePenalty = (lotuses, penalty) => {
  if (penalty.type === "flat") {
    return Math.min(lotuses, penalty.value);
  }
  return Math.floor(lotuses * penalty.value);
};
