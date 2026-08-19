// =============================================
// ПЕПА: Симулятор Болота — Точка входа
// Импорты, инициализация, обработчики, game loop
// =============================================

import { PREMIUM_ITEMS, CLICK_PENALTIES, POSITIVE_EVENTS, EVENT_IMAGE } from "./data/gameData.js";
import {
  initialState,
  calculatePenalty,
  calculatePositiveBonus,
  tickReducer,
  buyUpgradeReducer,
  buyPremiumReducer,
  buyDiamondsReducer
} from "./reducers/index.js";
import { formatNum } from "./utils/formatters.js";
import {
  updateUI,
  renderShopDOM,
  renderPremiumShopDOM,
  triggerJumpEffect,
  spawnFloatingText
} from "./ui/effects.js";
import {
  lotusEl, pepaEl, shopEl, premiumShopEl, premiumOverlay,
  openPremiumBtn, closePremiumBtn, buyDiamondsBtn, restartGameBtn
} from "./ui/domElements.js";

// =============================================
// Инициализация состояния
// =============================================

const currentState = localStorage.getItem("state");
let state = currentState ? JSON.parse(currentState) : initialState();
let lastTime = performance.now();

// --- Отрисовка при загрузке ---
renderShopDOM(state);
renderPremiumShopDOM(state);
updateUI(state);

// =============================================
// Обработчики событий
// =============================================

// --- Модальное окно премиум-магазина ---
openPremiumBtn.addEventListener("click", () => {
  premiumOverlay.classList.add("open");
  renderPremiumShopDOM(state);
  updateUI(state);
});

closePremiumBtn.addEventListener("click", () => {
  premiumOverlay.classList.remove("open");
});

premiumOverlay.addEventListener("click", (e) => {
  if (e.target === premiumOverlay) premiumOverlay.classList.remove("open");
});

// Покупка алмазов (заглушка)
buyDiamondsBtn.addEventListener("click", () => {
  state = buyDiamondsReducer(state, 50);
  updateUI(state);
  renderPremiumShopDOM(state);
});

restartGameBtn.addEventListener("click", () => {
  state = initialState();
  localStorage.removeItem("state");
});

// Покупка премиум-предмета
premiumShopEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".premium-buy-btn");
  if (!btn || btn.disabled || btn.classList.contains("active-label")) return;
  const itemId = btn.dataset.premium;
  const item = PREMIUM_ITEMS.find(i => i.id === itemId);
  if (item && item.timerField && state[item.timerField] > 0) return;
  state = buyPremiumReducer(state, itemId);
  updateUI(state);
  renderPremiumShopDOM(state);
});

// --- ГЛАВНЫЙ ОБРАБОТЧИК КЛИКА ---
pepaEl.addEventListener("click", (e) => {
  if (state.depressionTimer > 0) {
    triggerJumpEffect("normal");
    spawnFloatingText(e.clientX, e.clientY, "ДЕПРЕССИЯ", "penalty");
    return;
  }

  let newState = {...state};
  let uiAction = null;

  const effectiveClickPower = newState.clickPower
    * (newState.energyTimer > 0 ? 3 : 1)
    * newState.tempClickBuff;

  // 2. Штрафы
  if (newState.luckPotionTimer <= 0 && Math.random() < 0.10) {
    const penalty = CLICK_PENALTIES[Math.floor(Math.random() * CLICK_PENALTIES.length)];
    const lossAmount = calculatePenalty(newState.lotuses, penalty);
    if (lossAmount > 0) {
      newState = {...newState, lotuses: Math.max(0, newState.lotuses - lossAmount)};
      uiAction = {
        type: "penalty",
        text: `${penalty.text} -${formatNum(lossAmount)} 🪷`
      };
    } else {
      uiAction = {type: "penalty", text: penalty.text};
    }
  }
  // 3. Кража Жабыча
  else if (newState.shieldTimer <= 0 && Math.random() < newState.stealChance) {
    uiAction = {type: "stolen", text: "ЖАБЫЧ СКРАЛ КЛИК!"};
  }
  // 4. Успешный клик
  else {
    newState = {
      ...newState,
      lotuses: newState.lotuses + effectiveClickPower,
      totalEarned: newState.totalEarned + effectiveClickPower
    };
    uiAction = {type: "gain", text: `${effectiveClickPower} 🪷`};

    // 5. Положительное событие
    if (Math.random() < newState.positiveChance) {
      const posEvent = POSITIVE_EVENTS[Math.floor(Math.random() * POSITIVE_EVENTS.length)];
      const result = calculatePositiveBonus(newState, posEvent);

      if (result.bonus > 0) {
        newState = {
          ...newState,
          lotuses: newState.lotuses + result.bonus,
          totalEarned: newState.totalEarned + result.bonus
        };
      }
      if (result.tempClickBuff) {
        newState.tempClickBuff = result.tempClickBuff;
        newState.tempClickBuffTimer = result.tempClickBuffDuration;
      }
      if (result.tempPassiveBuff) {
        newState.tempPassiveBuff = result.tempPassiveBuff;
        newState.tempPassiveBuffTimer = result.tempPassiveBuffDuration;
      }

      uiAction = {
        type: "positive",
        text: `${posEvent.text} ${result.text}`
      };
    }
  }

  state = newState;

  if (uiAction.type === "penalty" || uiAction.type === "stolen") {
    triggerJumpEffect("damage");
    spawnFloatingText(e.clientX, e.clientY, uiAction.text, "penalty", EVENT_IMAGE[1].img);
  } else if (uiAction.type === "positive") {
    triggerJumpEffect("lucky");
    spawnFloatingText(e.clientX, e.clientY, uiAction.text, "positive", EVENT_IMAGE[0].img);
  } else {
    triggerJumpEffect("normal");
    spawnFloatingText(e.clientX, e.clientY, uiAction.text);
  }

  updateUI(state);
  renderShopDOM(state);
});

// Клик по магазину
shopEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".buy-btn");
  if (!btn || btn.disabled) return;
  const upgId = btn.dataset.upgrade;
  state = buyUpgradeReducer(state, upgId);
  updateUI(state);
  renderShopDOM(state);
});

// =============================================
// Game Loop
// =============================================

const gameLoop = (now) => {
  const dt = now - lastTime;
  lastTime = now;

  state = tickReducer(state, dt);
  lotusEl.textContent = formatNum(state.lotuses);

  if (Math.floor(now / 500) !== Math.floor((now - dt) / 500)) {
    updateUI(state);
    localStorage.setItem("state", JSON.stringify(state));
    renderShopDOM(state);
    if (premiumOverlay.classList.contains("open")) {
      renderPremiumShopDOM(state);
    }
  }

  requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);