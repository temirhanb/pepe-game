// =============================================
// Редюсер игрового тика (passive income, timers)
// Оптимизирован: lookup-карты вместо if-else цепочек
// =============================================

// Поля таймеров для итеративного декремента
const TIMER_FIELDS = [
  "depressionTimer", "shieldTimer", "antidepressantTimer",
  "luckPotionTimer", "energyTimer", "taxExemptionTimer",
  "tempClickBuffTimer", "tempPassiveBuffTimer"
];

// Маппинг: timerField → имя эффекта (для премиум-баффов)
const TIMER_TO_EFFECT = {
  shieldTimer: "shield",
  antidepressantTimer: "antidepressant",
  luckPotionTimer: "luck_potion",
  energyTimer: "energy",
  taxExemptionTimer: "tax_free"
};

/**
 * Обрабатывает один тик игры (dt в миллисекундах).
 * Декрементирует таймеры, начисляет пассивный доход, вычитает налог.
 * @param {object} state — текущее состояние
 * @param {number} dt — дельта времени в мс
 * @returns {object} — новое состояние
 */
export const tickReducer = (state, dt) => {
  const dtSec = dt / 1000;

  // --- Декремент всех таймеров одним проходом ---
  const timers = {};
  for (const field of TIMER_FIELDS) {
    timers[field] = Math.max(0, state[field] - dtSec);
  }

  let newEffects = [...state.activeEffects];

  // --- Депрессия (только если нет антидепрессанта) ---
  const { depressionTimer, antidepressantTimer, tempClickBuffTimer, tempPassiveBuffTimer } = timers;

  if (antidepressantTimer <= 0) {
    const depressionExpired = depressionTimer <= 0 && state.depressionTimer > 0;
    const depressionActive = depressionTimer > 0;
    const hasDepressionEffect = newEffects.includes("depression");

    switch (true) {
      case depressionExpired && state.hasDepression && Math.random() < 0.1:
        timers.depressionTimer = 3;
        if (!hasDepressionEffect) newEffects = [...newEffects, "depression"];
        break;
      case depressionExpired:
        newEffects = newEffects.filter(e => e !== "depression");
        break;
      case depressionActive && !hasDepressionEffect:
        newEffects = [...newEffects, "depression"];
        break;
    }
  } else {
    timers.depressionTimer = 0;
    newEffects = newEffects.filter(e => e !== "depression");
  }

  // --- Временные баффы от позитивных событий ---
  let tempClickBuff = state.tempClickBuff;
  let tempPassiveBuff = state.tempPassiveBuff;

  const clickExpired = tempClickBuffTimer <= 0 && state.tempClickBuffTimer > 0;
  const clickActive = tempClickBuffTimer > 0;
  switch (true) {
    case clickExpired:
      tempClickBuff = 1;
      newEffects = newEffects.filter(e => e !== "temp_click");
      break;
    case clickActive && !newEffects.includes("temp_click"):
      newEffects = [...newEffects, "temp_click"];
      break;
  }

  const passiveExpired = tempPassiveBuffTimer <= 0 && state.tempPassiveBuffTimer > 0;
  const passiveActive = tempPassiveBuffTimer > 0;
  switch (true) {
    case passiveExpired:
      tempPassiveBuff = 0;
      newEffects = newEffects.filter(e => e !== "temp_passive");
      break;
    case passiveActive && !newEffects.includes("temp_passive"):
      newEffects = [...newEffects, "temp_passive"];
      break;
  }

  // --- Пассивный доход ---
  const effectivePassiveIncome = state.passiveIncome + tempPassiveBuff;
  const rawPassive = effectivePassiveIncome * state.passiveMult * dtSec;
  const effectiveTaxRate = timers.taxExemptionTimer > 0 ? 0 : state.taxRate;
  const taxToPay = state.lotuses * effectiveTaxRate * dtSec;
  const finalPassive = Math.max(0, rawPassive - taxToPay);

  // --- Сборка активных эффектов: добавляем/убираем по таймерам ---
  for (const [timerField, effectName] of Object.entries(TIMER_TO_EFFECT)) {
    const timerVal = timers[timerField];
    const idx = newEffects.indexOf(effectName);
    const hasEffect = idx > -1;

    switch (true) {
      case timerVal > 0 && !hasEffect:
        newEffects.push(effectName);
        break;
      case timerVal <= 0 && hasEffect:
        newEffects.splice(idx, 1);
        break;
    }
  }

  return {
    ...state,
    lotuses: Math.max(0, state.lotuses + finalPassive),
    totalEarned: state.totalEarned + Math.max(0, rawPassive),
    ...timers,
    tempClickBuff,
    tempPassiveBuff,
    activeEffects: newEffects
  };
};
