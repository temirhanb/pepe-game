// =============================================
// 1. ДАННЫЕ ИГРЫ
// =============================================

const EVENT_IMAGE = [
  {name: "buff", img: "public/pepe-buff.png"},
  {name: "debuff", img: "public/pepe-debuff.png"}
];

const UPGRADES = [
  {
    id: "mushroom",
    name: "Мороженка", icon: "/public/pepe-ice.png",
    baseCost: 15, costMult: 1.5,
    desc: "+2 к силе клика",
    debuffDesc: "Штраф: -20% к пассивному доходу",
    apply: (state) => ({...state, clickPower: state.clickPower + 2, passiveMult: state.passiveMult * 0.8})
  },
  {
    id: "sigh", name: "Пистолет", icon: "/public/pepe-pistol.png",
    baseCost: 50, costMult: 1.6,
    desc: "+1 🪷 в секунду",
    debuffDesc: "Штраф: Пепа отвлекается, -1 к силе клика",
    apply: (state) => ({
      ...state,
      passiveIncome: state.passiveIncome + 1,
      clickPower: Math.max(1, state.clickPower - 1)
    })
  },
  {
    id: "zhabych_guard", name: "Копиум", icon: "/public/pepe-copium.png",
    baseCost: 200, costMult: 1.7,
    desc: "+5 🪷 в секунду",
    debuffDesc: "Штраф: 15% шанс, что клик ничего не даст (Жабыч отбирает)",
    apply: (state) => ({...state, passiveIncome: state.passiveIncome + 5, stealChance: state.stealChance + 0.15})
  },
  {
    id: "sad_playlist", name: "Обнимашки", icon: "/public/pepe-hug.png",
    baseCost: 1000, costMult: 1.8,
    desc: "Удваивает весь пассивный доход (x2)",
    debuffDesc: "Штраф: Случайно отключает клик на 3 сек (депрессия)",
    apply: (state) => ({...state, passiveMult: state.passiveMult * 2, hasDepression: true})
  },
  {
    id: "swamp_tears", name: "Я Бэтмен", icon: "/public/pepe-batman.png",
    baseCost: 5000, costMult: 2.0,
    desc: "+10 к силе клика",
    debuffDesc: "Штраф: Вы платите 5% от ваших лотосов каждую секунду",
    apply: (state) => ({...state, clickPower: state.clickPower + 10, taxRate: state.taxRate + 0.05})
  }
];

const CLICK_PENALTIES = [
  {text: "Комар укусил, выронил лотос!", type: "percent", value: 0.2},
  {text: "Пепа заплакал и раздавил цветок!", type: "percent", value: 0.4},
  {text: "Соскальзывание с кувшинки!", type: "flat", value: 15},
  {text: "Жабыч недоволен твоим кликом!", type: "flat", value: 30},
  {text: "Ветер сдул лепестки!", type: "percent", value: 0.15}
];

// =============================================
// 1b. ПОЛОЖИТЕЛЬНЫЕ СЛУЧАЙНЫЕ СОБЫТИЯ
// =============================================

const POSITIVE_EVENTS = [
  {
    text: "✨ Радужная кувшинка!",
    type: "click_mult", value: 3,
    desc: (v) => `+${v}x лотосов!`
  },
  {
    text: "🌙 Лунный свет!",
    type: "temp_click_buff", value: 2, duration: 10,
    desc: (v, d) => `x${v} сила клика на ${d}с!`
  },
  {
    text: "🐸 Жабёнок-помощник!",
    type: "flat_bonus", value: 25,
    desc: (v) => `+${v} 🪷 бонус!`
  },
  {
    text: "🐟 Золотой комар!",
    type: "temp_passive_buff", value: 3, duration: 15,
    desc: (v, d) => `+${v}/сек на ${d}с!`
  },
  {
    text: "🌧️ Тёплый дождь!",
    type: "percent_bonus", value: 0.1,
    desc: (v) => `+${Math.round(v * 100)}% от баланса!`
  },
  {
    text: "🌟 Комета над болотом!",
    type: "mega_click", value: 10,
    desc: (v) => `МЕГА-клик +${v} 🪷!`
  },
  {
    text: "🍀 Лотосовый вихрь!",
    type: "temp_click_buff", value: 5, duration: 5,
    desc: (v, d) => `x${v} сила клика на ${d}с!`
  }
];

// =============================================
// 1c. ПРЕМИУМ ПРЕДМЕТЫ (БЕЗ ДЕБАФФОВ)
// =============================================

const PREMIUM_ITEMS = [
  {
    id: "shield", name: "🛡️ Щит от Жабыча",
    cost: 50, duration: 60,
    desc: "Жабыч не может красть ваши клики",
    tag: "Убирает: кражу Жабыча",
    timerField: "shieldTimer"
  },
  {
    id: "antidepressant", name: "🌿 Антидепрессант",
    cost: 30, duration: 120,
    desc: "Пепа не впадает в депрессию",
    tag: "Убирает: депрессию",
    timerField: "antidepressantTimer"
  },
  {
    id: "luck_potion", name: "🧪 Зелье удачи",
    cost: 100, duration: 45,
    desc: "Полная защита от случайных штрафов",
    tag: "Убирает: ВСЕ штрафы при клике",
    timerField: "luckPotionTimer"
  },
  {
    id: "talisman", name: "🍀 Талисман удачи",
    cost: 75, duration: 0,
    desc: "Навсегда +8% к шансу положительных событий",
    tag: "Навсегда: +8% удача (накладывается)",
    timerField: null
  },
  {
    id: "energy", name: "⚡ Энергетик болота",
    cost: 40, duration: 30,
    desc: "Утраивает силу клика (x3), без побочек",
    tag: "Бафф: x3 сила клика",
    timerField: "energyTimer"
  },
  {
    id: "tax_free", name: "📜 Налоговая льгота",
    cost: 60, duration: 90,
    desc: "Отмена налога на лотосы",
    tag: "Убирает: налог на лотосы",
    timerField: "taxExemptionTimer"
  }
];

// =============================================
// 2. УПРАВЛЕНИЕ СОСТОЯНИЕМ (ФП Редюсеры)
// =============================================

const initialState = () => ({
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

const currentState = localStorage.getItem("state");

let state = currentState !== "" ? JSON.parse(currentState) : initialState();
let lastTime = performance.now();

// Редюсер расчёта штрафа
const calculatePenalty = (lotuses, penalty) => {
  if (penalty.type === "flat") {
    return Math.min(lotuses, penalty.value);
  } else {
    return Math.floor(lotuses * penalty.value);
  }
};

// Редюсер расчёта положительного бонуса
const calculatePositiveBonus = (state, event) => {
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

// Редюсер тика
const tickReducer = (state, dt) => {
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

// Редюсер покупки обычного улучшения
const buyUpgradeReducer = (state, upgradeId) => {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade || state.ownedUpgrades.includes(upgradeId)) return state;
  const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, state.ownedUpgrades.length));
  if (state.lotuses < cost) return state;
  let newState = {
    ...state,
    lotuses: state.lotuses - cost,
    ownedUpgrades: [...state.ownedUpgrades, upgradeId]
  };
  return upgrade.apply(newState);
};

// Редюсер покупки премиум-предмета
const buyPremiumReducer = (state, itemId) => {
  const item = PREMIUM_ITEMS.find(i => i.id === itemId);
  if (!item) return state;
  if (state.diamonds < item.cost) return state;

  let newState = {...state, diamonds: state.diamonds - item.cost};

  if (item.timerField) {
    // Временный бафф — продлевает/устанавливает таймер
    newState[item.timerField] = item.duration;
  } else if (item.id === "talisman") {
    // Постоянное улучшение — увеличивает шанс
    newState.talismanCount = state.talismanCount + 1;
    newState.positiveChance = 0.05 + newState.talismanCount * 0.08;
  }

  return newState;
};

// Редюсер покупки алмазов (заглушка для реальных платежей)
const buyDiamondsReducer = (state, amount) => {
  return {...state, diamonds: state.diamonds + amount};
};

// =============================================
// 3. ЧИСТЫЕ ФУНКЦИИ ДЛЯ UI
// =============================================

const formatNum = (n) => {
  if (n < 1000) return Math.floor(n).toString();
  const suffixes = ["", "K", "M", "B"];
  const tier = Math.min(Math.floor(Math.log10(n) / 3), suffixes.length - 1);
  return (n / Math.pow(1000, tier)).toFixed(1) + suffixes[tier];
};

const formatTime = (t) => {
  if (t <= 0) return "";
  const s = Math.ceil(t);
  if (s < 60) return s + "с";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m + ":" + (sec < 10 ? "0" : "") + sec;
};

const getUpgradeCost = (upgradeId, ownedCount) => {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, ownedCount));
};

const renderShop = (state) => UPGRADES.map(upg => {
  const isOwned = state.ownedUpgrades.includes(upg.id);
  const cost = getUpgradeCost(upg.id, state.ownedUpgrades.length);
  const canAfford = state.lotuses >= cost && !isOwned;
  return `
    <div class="upgrade-card ${isOwned ? "owned" : ""}">
      <div class="uc-header">
      <img src="${upg.icon}" alt="${upg.name}"/>
        <div class="uc-name">${upg.name}</div>
        <div class="uc-cost">‫🪷 ${formatNum(cost)}</div>
      </div>
      <div class="uc-desc">✅ ${upg.desc}</div>
      <div class="uc-debuff">⚠️ ${upg.debuffDesc}</div>
      <button class="buy-btn" data-upgrade="${upg.id}" ${!canAfford ? "disabled" : ""}>
        ${isOwned ? "Купил" : "Купить"}
      </button>
    </div>`;
}).join("");

const renderPremiumShop = (state) => PREMIUM_ITEMS.map(item => {
  const canAfford = state.diamonds >= item.cost;
  const timer = item.timerField ? state[item.timerField] : 0;
  const isActive = timer > 0;
  const isPermanent = item.id === "talisman";
  return `
    <div class="premium-card ${isActive ? "active-buff" : ""}">
      <div class="pc-header">
        <div class="pc-name">${item.name}</div>
        <div class="pc-cost">‫💎 ${item.cost}</div>
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

const renderEffects = (state) => {
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

// =============================================
// 4. ПОБОЧНЫЕ ЭФФЕКТЫ (DOM, Анимации)
// =============================================

const lotusEl = document.getElementById("lotusCount");
const passiveEl = document.getElementById("passiveCount");
const clickPowerEl = document.getElementById("clickPower");
const luckChanceEl = document.getElementById("luckChance");
const shopEl = document.getElementById("shopContainer");
const effectsEl = document.getElementById("effectsContainer");
const pepaEl = document.getElementById("pepa");
const pondEl = document.getElementById("pond");
const diamondEl = document.getElementById("diamondCount");
const modalDiamondEl = document.getElementById("modalDiamondCount");
const premiumOverlay = document.getElementById("premiumOverlay");
const premiumShopEl = document.getElementById("premiumShopContainer");
const openPremiumBtn = document.getElementById("openPremium");
const closePremiumBtn = document.getElementById("closePremium");
const buyDiamondsBtn = document.getElementById("buyDiamondsBtn");
const restartGameBtn = document.getElementById("restartBtn");

const updateUI = (state) => {
  lotusEl.textContent = formatNum(state.lotuses);
  const effectiveTax = state.taxExemptionTimer > 0 ? 0 : state.taxRate;
  const realPassive = (state.passiveIncome + state.tempPassiveBuff) * state.passiveMult - (state.lotuses * effectiveTax);
  passiveEl.textContent = formatNum(Math.max(0, realPassive));
  const effectiveClickPower = state.clickPower * (state.energyTimer > 0 ? 3 : 1) * state.tempClickBuff;
  clickPowerEl.textContent = effectiveClickPower;
  luckChanceEl.textContent = Math.round(state.positiveChance * 100);
  diamondEl.textContent = state.diamonds;
  modalDiamondEl.textContent = state.diamonds;
  effectsEl.innerHTML = renderEffects(state);
};

const renderShopDOM = (state) => {
  shopEl.innerHTML = renderShop(state);
};
const renderPremiumShopDOM = (state) => {
  premiumShopEl.innerHTML = renderPremiumShop(state);
};

const triggerJumpEffect = (type) => {
  pepaEl.classList.remove("jumping", "damaged", "lucky");
  void pepaEl.offsetWidth;

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
    ripple.style.left = (pondEl.offsetWidth / 2 - 5) + "px";
    ripple.style.top = (pondEl.offsetHeight / 2 - 5) + "px";
    pondEl.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  } else {
    pepaEl.classList.add("jumping");
    const ripple = document.createElement("div");
    ripple.className = "ripple";
    ripple.style.left = (pondEl.offsetWidth / 2 - 5) + "px";
    ripple.style.top = (pondEl.offsetHeight / 2 - 5) + "px";
    pondEl.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
  }
};

const spawnFloatingText = (x, y, text, type = "normal", image) => {
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

// --- Инициализация ---
renderShopDOM(state);
renderPremiumShopDOM(state);
updateUI(state);

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

// Покупка алмазов (заглушка — в проде тут платёжный SDK)
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
  // Не покупать, если временный бафф уже активен
  if (item && item.timerField && state[item.timerField] > 0) return;
  state = buyPremiumReducer(state, itemId);
  updateUI(state);
  renderPremiumShopDOM(state);
});

// --- ГЛАВНЫЙ ОБРАБОТЧИК КЛИКА ---
pepaEl.addEventListener("click", (e) => {
  // 1. Блокировка из-за депрессии (если нет антидепрессанта)
  if (state.depressionTimer > 0) {
    triggerJumpEffect("normal");
    spawnFloatingText(e.clientX, e.clientY, "ДЕПРЕССИЯ", "penalty");
    return;
  }

  let newState = {...state};
  let uiAction = null;

  // Эффективная сила клика с учетом баффов
  const effectiveClickPower = newState.clickPower
    * (newState.energyTimer > 0 ? 3 : 1)
    * newState.tempClickBuff;

  // 2. Штрафы — ОТКЛЮЧЕНЫ если Зелье удачи активно
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
  // 3. Кража Жабыча — ОТКЛЮЧЕНА если Щит активен
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

    // 5. Ролл на положительное случайное событие
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
      // Применяем временные баффы
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

  // Визуальные эффекты
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

// Клик по обычному магазину
shopEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".buy-btn");
  if (!btn || btn.disabled) return;
  const upgId = btn.dataset.upgrade;
  state = buyUpgradeReducer(state, upgId);
  updateUI(state);
  renderShopDOM(state);
});

// --- Game Loop ---
const gameLoop = (now) => {
  const dt = now - lastTime;
  lastTime = now;

  state = tickReducer(state, dt);
  lotusEl.textContent = formatNum(state.lotuses);

  if (Math.floor(now / 500) !== Math.floor((now - dt) / 500)) {
    updateUI(state);
    localStorage.setItem("state", JSON.stringify(state));
    renderShopDOM(state);
    // Обновлять премиум-магазин только если открыт
    if (premiumOverlay.classList.contains("open")) {
      renderPremiumShopDOM(state);
    }
  }

  requestAnimationFrame(gameLoop);
};

requestAnimationFrame(gameLoop);
