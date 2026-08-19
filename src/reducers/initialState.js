// =============================================
// Начальное состояние игры
// =============================================

export const initialState = () => ({
  lotuses: 0,
  totalEarned: 0,
  clickPower: 5,
  passiveIncome: 0,
  passiveMult: 1.0,
  stealChance: 0,
  taxRate: 0,
  hasDepression: false,
  depressionTimer: 0,
  ownedUpgrades: [],
  activeEffects: [],
  // Премиум-валюта
  diamonds: 100,
  // Шанс положительных событий
  positiveChance: 0.05,
  talismanCount: 0,
  // Временные баффы от позитивных событий
  tempClickBuff: 1,
  tempClickBuffTimer: 0,
  tempPassiveBuff: 0,
  tempPassiveBuffTimer: 0,
  // Таймеры премиум-предметов
  shieldTimer: 0,
  antidepressantTimer: 0,
  luckPotionTimer: 0,
  energyTimer: 0,
  taxExemptionTimer: 0
});
