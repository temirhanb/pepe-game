// =============================================
// Редюсер игрового тика (passive income, timers)
// =============================================

/**
 * Обрабатывает один тик игры (dt в миллисекундах).
 * Декрементирует таймеры, начисляет пассивный доход, вычитает налог.
 * @param {object} state — текущее состояние
 * @param {number} dt — дельта времени в мс
 * @returns {object} — новое состояние
 */
export const tickReducer = (state, dt) => {
  const dtSec = dt / 1000;

  // --- Декремент всех таймеров ---
  let depressionTimer = Math.max(0, state.depressionTimer - dtSec);
  let shieldTimer = Math.max(0, state.shieldTimer - dtSec);
  let antidepressantTimer = Math.max(0, state.antidepressantTimer - dtSec);
  let luckPotionTimer = Math.max(0, state.luckPotionTimer - dtSec);
  let energyTimer = Math.max(0, state.energyTimer - dtSec);
  let taxExemptionTimer = Math.max(0, state.taxExemptionTimer - dtSec);
  let tempClickBuffTimer = Math.max(0, state.tempClickBuffTimer - dtSec);
  let tempPassiveBuffTimer = Math.max(0, state.tempPassiveBuffTimer - dtSec);

  let newEffects = [...state.activeEffects];

  // --- Депрессия (только если нет антидепрессанта) ---
  if (antidepressantTimer <= 0) {
    if (depressionTimer <= 0 && state.depressionTimer > 0) {
      if (state.hasDepression && Math.random() < 0.1) {
        depressionTimer = 3;
        if (!newEffects.includes("depression")) newEffects = [...newEffects, "depression"];
      } else {
        newEffects = newEffects.filter(e => e !== "depression");
      }
    } else if (depressionTimer > 0 && !newEffects.includes("depression")) {
      newEffects = [...newEffects, "depression"];
    }
  } else {
    // Антидепрессант активен — убираем депрессию
    depressionTimer = 0;
    newEffects = newEffects.filter(e => e !== "depression");
  }

  // --- Временные баффы от позитивных событий ---
  let tempClickBuff = state.tempClickBuff;
  let tempPassiveBuff = state.tempPassiveBuff;

  if (tempClickBuffTimer <= 0 && state.tempClickBuffTimer > 0) {
    tempClickBuff = 1;
    newEffects = newEffects.filter(e => e !== "temp_click");
  } else if (tempClickBuffTimer > 0 && !newEffects.includes("temp_click")) {
    newEffects = [...newEffects, "temp_click"];
  }

  if (tempPassiveBuffTimer <= 0 && state.tempPassiveBuffTimer > 0) {
    tempPassiveBuff = 0;
    newEffects = newEffects.filter(e => e !== "temp_passive");
  } else if (tempPassiveBuffTimer > 0 && !newEffects.includes("temp_passive")) {
    newEffects = [...newEffects, "temp_passive"];
  }

  // --- Пассивный доход ---
  const effectivePassiveIncome = state.passiveIncome + tempPassiveBuff;
  const rawPassive = effectivePassiveIncome * state.passiveMult * dtSec;
  const effectiveTaxRate = taxExemptionTimer > 0 ? 0 : state.taxRate;
  const taxToPay = state.lotuses * effectiveTaxRate * dtSec;
  const finalPassive = Math.max(0, rawPassive - taxToPay);

  // --- Сборка активных эффектов для UI ---
  const effects = newEffects;
  if (shieldTimer > 0 && !effects.includes("shield")) effects.push("shield");
  if (antidepressantTimer > 0 && !effects.includes("antidepressant")) effects.push("antidepressant");
  if (luckPotionTimer > 0 && !effects.includes("luck_potion")) effects.push("luck_potion");
  if (energyTimer > 0 && !effects.includes("energy")) effects.push("energy");
  if (taxExemptionTimer > 0 && !effects.includes("tax_free")) effects.push("tax_free");

  // Убираем истёкшие премиум-эффекты
  if (shieldTimer <= 0) {
    const i = effects.indexOf("shield");
    if (i > -1) effects.splice(i, 1);
  }
  if (antidepressantTimer <= 0) {
    const i = effects.indexOf("antidepressant");
    if (i > -1) effects.splice(i, 1);
  }
  if (luckPotionTimer <= 0) {
    const i = effects.indexOf("luck_potion");
    if (i > -1) effects.splice(i, 1);
  }
  if (energyTimer <= 0) {
    const i = effects.indexOf("energy");
    if (i > -1) effects.splice(i, 1);
  }
  if (taxExemptionTimer <= 0) {
    const i = effects.indexOf("tax_free");
    if (i > -1) effects.splice(i, 1);
  }

  return {
    ...state,
    lotuses: Math.max(0, state.lotuses + finalPassive),
    totalEarned: state.totalEarned + Math.max(0, rawPassive),
    depressionTimer,
    shieldTimer,
    antidepressantTimer,
    luckPotionTimer,
    energyTimer,
    taxExemptionTimer,
    tempClickBuff,
    tempClickBuffTimer,
    tempPassiveBuff,
    tempPassiveBuffTimer,
    activeEffects: effects
  };
};
