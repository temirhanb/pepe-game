// =============================================
// Утилиты форматирования
// =============================================

/**
 * Форматирует число: до 1000 — целое, далее K/M/B.
 * @param {number} n
 * @returns {string}
 */
export const formatNum = (n) => {
  if (n < 1000) return Math.floor(n).toString();
  const suffixes = ["", "K", "M", "B"];
  const tier = Math.min(Math.floor(Math.log10(n) / 3), suffixes.length - 1);
  return (n / Math.pow(1000, tier)).toFixed(1) + suffixes[tier];
};

/**
 * Форматирует оставшееся время таймера.
 * @param {number} t — секунды
 * @returns {string}
 */
export const formatTime = (t) => {
  if (t <= 0) return "";
  const s = Math.ceil(t);
  if (s < 60) return s + "с";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ":" + (sec < 10 ? "0" : "") + sec;
};

import { UPGRADES } from "../data/gameData.js";

/**
 * Вычисляет стоимость улучшения по id и количеству уже купленных.
 * @param {string} upgradeId
 * @param {number} ownedCount
 * @returns {number}
 */
export const getUpgradeCost = (upgradeId, ownedCount) => {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, ownedCount));
};
