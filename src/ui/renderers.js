// =============================================
// Чистые функции рендеринга (возвращают HTML-строки)
// =============================================

import { UPGRADES, PREMIUM_ITEMS } from "../data/gameData.js";
import { formatNum, formatTime } from "../utils/formatters.js";

/**
 * Генерирует HTML для магазина обычных улучшений.
 * @param {object} state
 * @returns {string}
 */
export const renderShop = (state) => UPGRADES.map(upg => {
  const isOwned = state.ownedUpgrades.includes(upg.id);
  const cost = Math.floor(upg.baseCost * Math.pow(upg.costMult, state.ownedUpgrades.length));
  const canAfford = state.lotuses >= cost && !isOwned;
  return `
    <div class="upgrade-card ${isOwned ? "owned" : ""}">
      <div class="uc-header">
      <img src="${upg.icon}" alt="${upg.name}"/>
        <div class="uc-name">${upg.name}</div>
        <div class="uc-cost">‏🪷 ${formatNum(cost)}</div>
      </div>
      <div class="uc-desc">✅ ${upg.desc}</div>
      <div class="uc-debuff">⚠️ ${upg.debuffDesc}</div>
      <button class="buy-btn" data-upgrade="${upg.id}" ${!canAfford ? "disabled" : ""}>
        ${isOwned ? "Купил" : "Купить"}
      </button>
    </div>`;
}).join("");

/**
 * Генерирует HTML для премиум-магазина.
 * @param {object} state
 * @returns {string}
 */
export const renderPremiumShop = (state) => PREMIUM_ITEMS.map(item => {
  const canAfford = state.diamonds >= item.cost;
  const timer = item.timerField ? state[item.timerField] : 0;
  const isActive = timer > 0;
  const isPermanent = item.id === "talisman";
  return `
    <div class="premium-card ${isActive ? "active-buff" : ""}">
      <div class="pc-header">
        <div class="pc-name">${item.name}</div>
        <div class="pc-cost">‏💎 ${item.cost}</div>
      </div>
      <div class="pc-desc">✔️ ${item.desc}</div>
      <div class="pc-tag">⭐ ${item.tag}</div>
      ${isActive ? `<div class="pc-timer">⏱ ${formatTime(timer)}</div>` : ""}
      ${isPermanent ? `<div class="pc-timer" style="color: var(--gold);">∞ куплено: ${state.talismanCount}x</div>` : ""}
      <button class="premium-buy-btn ${isActive ? "active-label" : ""}" data-premium="${item.id}" ${!canAfford && !isActive ? "disabled" : ""}>
        ${isActive ? "✅ АКТИВНО" : (isPermanent ? "КУПИТЬ НАВСЕГДА" : "АКТИВИРОВАТЬ")}
      </button>
    </div>`;
}).join("");

/**
 * Генерирует HTML для ленты активных эффектов.
 * @param {object} state
 * @returns {string}
 */
export const renderEffects = (state) => {
  const effects = state.activeEffects;
  if (effects.length === 0) return "";
  const map = {
    "depression": {text: "😰 ДЕПРЕССИЯ (клики 0)", cls: ""},
    "shield": {text: "🛡️ ЩИТ ОТ ЖАБЫЧА", cls: "premium-badge"},
    "antidepressant": {text: "🌿 АНТИДЕПРЕССАНТ", cls: "premium-badge"},
    "luck_potion": {text: "🧪 ЗЕЛЬЕ УДАЧИ", cls: "premium-badge"},
    "energy": {text: "⚡ ЭНЕРГЕТИК x3", cls: "premium-badge"},
    "tax_free": {text: "📜 БЕЗ НАЛОГА", cls: "premium-badge"},
    "temp_click": {text: `✨ БАФФ КЛИКА x${state.tempClickBuff}`, cls: "positive-badge"},
    "temp_passive": {text: `🐟 БОНУС +${state.tempPassiveBuff}/сек`, cls: "positive-badge"}
  };
  return [...new Set(effects)]
    .map(e => {
      const info = map[e];
      if (!info) return "";
      return `<div class="effect-badge ${info.cls}">${info.text}</div>`;
    })
    .filter(Boolean)
    .join("");
};
