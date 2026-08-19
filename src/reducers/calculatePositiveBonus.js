// =============================================
// Редюсер расчёта положительного бонуса
// =============================================

/**
 * Вычисляет бонус от положительного случайного события.
 * @param {object} state — текущее состояние игры
 * @param {object} event — объект события из POSITIVE_EVENTS
 * @returns {{bonus: number, text: string, tempClickBuff?: number, tempClickBuffDuration?: number, tempPassiveBuff?: number, tempPassiveBuffDuration?: number}}
 */
export const calculatePositiveBonus = (state, event) => {
  const baseClick = state.clickPower * (state.energyTimer > 0 ? 3 : 1) * state.tempClickBuff;

  switch (event.type) {
    case "click_mult":
      return {bonus: baseClick * event.value, text: event.desc(event.value)};

    case "flat_bonus":
      return {bonus: event.value, text: event.desc(event.value)};

    case "percent_bonus":
      return {bonus: Math.max(1, Math.floor(state.lotuses * event.value)), text: event.desc(event.value)};

    case "mega_click":
      return {bonus: event.value, text: event.desc(event.value)};

    case "temp_click_buff":
      return {
        bonus: 0,
        text: event.desc(event.value, event.duration),
        tempClickBuff: event.value,
        tempClickBuffDuration: event.duration
      };

    case "temp_passive_buff":
      return {
        bonus: 0,
        text: event.desc(event.value, event.duration),
        tempPassiveBuff: event.value,
        tempPassiveBuffDuration: event.duration
      };

    default:
      return {bonus: 0, text: ""};
  }
};
