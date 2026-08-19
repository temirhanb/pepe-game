// =============================================
// Побочные эффекты: обновление DOM, анимации
// Оптимизировано: lookup-карты, грязная проверка
// =============================================

import { formatNum } from "../utils/formatters.js";
import { renderEffects, renderShop, renderPremiumShop } from "./renderers.js";
import {
  lotusEl, passiveEl, clickPowerEl, luckChanceEl,
  diamondEl, modalDiamondEl, effectsEl,
  shopEl, premiumShopEl,
  pepaEl, pondEl
} from "./domElements.js";

// --- Кэш предыдущих значений для грязной проверки ---
const prev = {
  lotuses: "", passive: "", clickPower: "",
  luckChance: "", diamonds: "", effectsHTML: ""
};

// Карта классов для floating text
const FLOAT_CLS_MAP = { penalty: "penalty", positive: "positive" };

// Стратегии анимации по типу
const JUMP_STRATEGIES = {
  damage(state) {
    pepaEl.classList.add("damaged");
    document.body.classList.remove("shake");
    void document.body.offsetWidth;
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 400);
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    addRipple(ripple);
  },
  lucky() {
    pepaEl.classList.add("lucky");
    const ripple = document.createElement("div");
    ripple.className = "ripple gold";
    addRipple(ripple);
  },
  normal() {
    pepaEl.classList.add("jumping");
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    addRipple(ripple);
  }
};

/** Добавляет ripple-элемент на пруд */
const addRipple = (ripple) => {
  ripple.style.left = (pondEl.offsetWidth / 2 - 5) + "px";
  ripple.style.top = (pondEl.offsetHeight / 2 - 5) + "px";
  pondEl.appendChild(ripple);
  setTimeout(() => ripple.remove(), 800);
};

/**
 * Обновляет текстовые поля — только если значения изменились.
 * @param {object} state
 */
export const updateUI = (state) => {
  const effectiveTax = state.taxExemptionTimer > 0 ? 0 : state.taxRate;
  const realPassive = (state.passiveIncome + state.tempPassiveBuff) * state.passiveMult - (state.lotuses * effectiveTax);
  const clickPow = state.clickPower * (state.energyTimer > 0 ? 3 : 1) * state.tempClickBuff;
  const luck = String(Math.round(state.positiveChance * 100));
  const dia = String(state.diamonds);
  const eff = renderEffects(state);

  const lotusStr = formatNum(state.lotuses);
  const passiveStr = formatNum(Math.max(0, realPassive));
  const clickStr = String(clickPow);

  if (lotusStr !== prev.lotuses) { lotusEl.textContent = lotusStr; prev.lotuses = lotusStr; }
  if (passiveStr !== prev.passive) { passiveEl.textContent = passiveStr; prev.passive = passiveStr; }
  if (clickStr !== prev.clickPower) { clickPowerEl.textContent = clickStr; prev.clickPower = clickStr; }
  if (luck !== prev.luckChance) { luckChanceEl.textContent = luck; prev.luckChance = luck; }
  if (dia !== prev.diamonds) { diamondEl.textContent = dia; modalDiamondEl.textContent = dia; prev.diamonds = dia; }
  if (eff !== prev.effectsHTML) { effectsEl.innerHTML = eff; prev.effectsHTML = eff; }
};

/** Кэш для пропуска лишних innerHTML */
let shopHTMLCache = "";
let premiumHTMLCache = "";

/**
 * Рендерит магазин — только если HTML изменился.
 * @param {object} state
 */
export const renderShopDOM = (state) => {
  const html = renderShop(state);
  if (html !== shopHTMLCache) {
    shopEl.innerHTML = html;
    shopHTMLCache = html;
  }
};

/**
 * Рендерит премиум-магазин — только если HTML изменился.
 * @param {object} state
 */
export const renderPremiumShopDOM = (state) => {
  const html = renderPremiumShop(state);
  if (html !== premiumHTMLCache) {
    premiumShopEl.innerHTML = html;
    premiumHTMLCache = html;
  }
};

/** Сбрасывает кэши рендера (при перезапуске) */
export const resetRenderCaches = () => {
  shopHTMLCache = "";
  premiumHTMLCache = "";
  prev.lotuses = "";
  prev.passive = "";
  prev.clickPower = "";
  prev.luckChance = "";
  prev.diamonds = "";
  prev.effectsHTML = "";
};

/**
 * Анимация прыжка Пепы — lookup-карта стратегий.
 * @param {"normal"|"damage"|"lucky"} type
 */
export const triggerJumpEffect = (type) => {
  pepaEl.classList.remove("jumping", "damaged", "lucky");
  void pepaEl.offsetWidth;
  const strategy = JUMP_STRATEGIES[type];
  if (strategy) strategy();
};

/**
 * Создаёт всплывающий текст на экране.
 */
export const spawnFloatingText = (x, y, text, type = "normal", image) => {
  const ft = document.createElement("div");
  ft.className = `float-text ${FLOAT_CLS_MAP[type] || ""}`;
  ft.textContent = text;
  ft.style.left = (x - 30) + "px";
  ft.style.top = (y - 20) + "px";
  document.body.appendChild(ft);
  if (image) {
    const img = document.createElement("img");
    img.setAttribute("src", image);
    ft.appendChild(img);
  }
  setTimeout(() => ft.remove(), 1000);
};
