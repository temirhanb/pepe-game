// =============================================
// Побочные эффекты: обновление DOM, анимации
// =============================================

import { formatNum } from "../utils/formatters.js";
import { renderEffects, renderShop, renderPremiumShop } from "./renderers.js";
import {
  lotusEl, passiveEl, clickPowerEl, luckChanceEl,
  diamondEl, modalDiamondEl, effectsEl,
  shopEl, premiumShopEl,
  pepaEl, pondEl,
  premiumOverlay
} from "./domElements.js";
import { EVENT_IMAGE } from "../data/gameData.js";

/**
 * Обновляет текстовые поля в header-статистике.
 * @param {object} state
 */
export const updateUI = (state) => {
  lotusEl.textContent = formatNum(state.lotuses);
  const effectiveTax = state.taxExemptionTimer > 0 ? 0 : state.taxRate;
  const realPassive = (state.passiveIncome + state.tempPassiveBuff) * state.passiveMult - (state.lotuses * effectiveTax);
  passiveEl.textContent = formatNum(Math.max(0, realPassive));
  clickPowerEl.textContent = state.clickPower * (state.energyTimer > 0 ? 3 : 1) * state.tempClickBuff;
  luckChanceEl.textContent = Math.round(state.positiveChance * 100);
  diamondEl.textContent = state.diamonds;
  modalDiamondEl.textContent = state.diamonds;
  effectsEl.innerHTML = renderEffects(state);
};

/**
 * Рендерит магазин в DOM.
 * @param {object} state
 */
export const renderShopDOM = (state) => {
  shopEl.innerHTML = renderShop(state);
};

/**
 * Рендерит премиум-магазин в DOM.
 * @param {object} state
 */
export const renderPremiumShopDOM = (state) => {
  premiumShopEl.innerHTML = renderPremiumShop(state);
};



/**
 * Анимация прыжка Пепы и эффекты на пруду.
 * @param {"normal"|"damage"|"lucky"} type
 */
export const triggerJumpEffect = (type) => {
  pepaEl.classList.remove("jumping", "damaged", "lucky");
  void pepaEl.offsetWidth;
  const changeRippleStyle = (ripple) => {
    ripple.style.left = (pondEl.offsetWidth / 2 - 5) + "px";
    ripple.style.top = (pondEl.offsetHeight / 2 - 5) + "px";
    pondEl.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  };
  if (type === "damage") {
    pepaEl.classList.add("damaged");
    document.body.classList.remove("shake");
    void document.body.offsetWidth;
    document.body.classList.add("shake");
    setTimeout(() => document.body.classList.remove("shake"), 400);
  } else if (type === "lucky") {
    pepaEl.classList.add("lucky");
    const ripple = document.createElement("div");
    ripple.className = "ripple gold";
    changeRippleStyle(ripple);
  } else {
    pepaEl.classList.add("jumping");
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    changeRippleStyle(ripple);
  }
};

/**
 * Создаёт всплывающий текст на экране.
 * @param {number} x
 * @param {number} y
 * @param {string} text
 * @param {"normal"|"penalty"|"positive"} type
 * @param {string} [image]
 */
export const spawnFloatingText = (x, y, text, type = "normal", image) => {
  const ft = document.createElement("div");
  const spawnImage = document.createElement("img");
  spawnImage.setAttribute("src", image);

  const cls = type === "penalty" ? "penalty" : (type === "positive" ? "positive" : "");
  ft.className = `float-text ${cls}`;
  ft.textContent = text;
  ft.style.left = (x - 30) + "px";
  ft.style.top = (y - 20) + "px";
  document.body.appendChild(ft);
  image && ft.appendChild(spawnImage);
  setTimeout(() => ft.remove(), 1000);
};
