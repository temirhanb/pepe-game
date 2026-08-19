// =============================================
// ПЕПА: Симулятор Болота — Точка входа
// Оптимизировано: тик с аккумулированием, lazy premium,
// lookup-карты вместо else-if, убраны лишние ререндеры
// =============================================

import {PREMIUM_ITEMS, CLICK_PENALTIES, POSITIVE_EVENTS, EVENT_IMAGE} from "./data/gameData.js";
import {
  initialState,
  calculatePenalty,
  calculatePositiveBonus,
  tickReducer,
  buyUpgradeReducer,
  buyPremiumReducer,
  buyDiamondsReducer
} from "./reducers/index.js";
import {formatNum} from "./utils/formatters.js";
import {
  updateUI,
  renderShopDOM,
  renderPremiumShopDOM,
  resetRenderCaches,
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

const saved = localStorage.getItem("state");
let state = saved ? JSON.parse(saved) : initialState();
let lastTime = performance.now();

// --- Отрисовка при загрузке (premium НЕ рендерим — модалка скрыта) ---
renderShopDOM(state);
updateUI(state);

// =============================================
// Обработчики событий
// =============================================

// --- Модальное окно премиум-магазина (lazy render) ---
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

// --- Карта визуальных стратегий для результата клика ---
const CLICK_VISUAL_MAP = {
  penalty: {jump: "damage", floatType: "penalty", image: EVENT_IMAGE[1].img},
  stolen: {jump: "damage", floatType: "penalty", image: EVENT_IMAGE[1].img},
  positive: {jump: "lucky", floatType: "positive", image: EVENT_IMAGE[0].img},
  gain: {jump: "normal", floatType: "normal"}
};

// --- ГЛАВНЫЙ ОБРАБОТЧИК КЛИКА ---
pepaEl.addEventListener("click", (e) => {
  if (state.depressionTimer > 0) {
    triggerJumpEffect("normal");
    spawnFloatingText(e.clientX, e.clientY, "ДЕПРЕССИЯ", "penalty");
    return;
  }

  let newState = {...state};
  let uiAction;

  const effectiveClickPower = newState.clickPower
    * (newState.energyTimer > 0 ? 3 : 1)
    * newState.tempClickBuff;

  const roll = Math.random();
  const penaltyRoll = newState.luckPotionTimer <= 0 && roll < 0.10;
  const stealRoll = !penaltyRoll && newState.shieldTimer <= 0 && roll < newState.stealChance;

  switch (true) {
    case penaltyRoll: {
      const penalty = CLICK_PENALTIES[Math.floor(Math.random() * CLICK_PENALTIES.length)];
      const lossAmount = calculatePenalty(newState.lotuses, penalty);
      if (lossAmount > 0) {
        newState = {...newState, lotuses: Math.max(0, newState.lotuses - lossAmount)};
      }
      uiAction = {
        type: "penalty",
        text: lossAmount > 0 ? `${penalty.text} -${formatNum(lossAmount)} 🪷` : penalty.text
      };
      break;
    }
    case stealRoll:
      uiAction = {type: "stolen", text: "ЖАБЫЧ СКРАЛ КЛИК!"};
      break;
    default: {
      newState = {
        ...newState,
        lotuses: newState.lotuses + effectiveClickPower,
        totalEarned: newState.totalEarned + effectiveClickPower
      };
      uiAction = {type: "gain", text: `${effectiveClickPower} 🪷`};

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
  }

  state = newState;

  // Визуальные эффекты через lookup-карту
  const visual = CLICK_VISUAL_MAP[uiAction.type];
  triggerJumpEffect(visual.jump);
  spawnFloatingText(e.clientX, e.clientY, uiAction.text, visual.floatType, visual.image);

  updateUI(state);
  // Магазин ререндерить не надо — подхватится на ближайшем тике (макс. 250мс)
});

// Клик по магазину
shopEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".buy-btn");
  if (!btn || btn.disabled) return;
  state = buyUpgradeReducer(state, btn.dataset.upgrade);
  updateUI(state);
  renderShopDOM(state);
});

// =============================================
// Game Loop — тик с аккумулированием (250мс)
// =============================================

const TICK_INTERVAL = 250;
let tickAccum = 0;
let lastUIUpdate = 0;
const UI_INTERVAL = 500;
let premiumNeedsUpdate = false;

const gameLoop = (now) => {
  const dt = now - lastTime;
  lastTime = now;

  // Аккумулируем время, тикаем фиксированными порциями
  tickAccum += dt;
  if (tickAccum >= TICK_INTERVAL) {
    state = tickReducer(state, tickAccum);
    tickAccum = 0;

    // Обновляем лотосы (самый частый элемент)
    lotusEl.textContent = formatNum(state.lotuses);
  }

  // UI + save + shop — каждые 500мс
  if (now - lastUIUpdate >= UI_INTERVAL) {
    lastUIUpdate = now;
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
