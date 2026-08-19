// =============================================
// 1. ДАННЫЕ ИГРЫ — Константы, описания, конфигурация
// =============================================

export const EVENT_IMAGE = [
  {name: "buff", img: "public/pepe-buff.png"},
  {name: "debuff", img: "public/pepe-debuff.png"}
];

export const UPGRADES = [
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

export const CLICK_PENALTIES = [
  {text: "Комар укусил, выронил лотос!", type: "percent", value: 0.2},
  {text: "Пепа заплакал и раздавил цветок!", type: "percent", value: 0.4},
  {text: "Соскальзывание с кувшинки!", type: "flat", value: 15},
  {text: "Жабыч недоволен твоим кликом!", type: "flat", value: 30},
  {text: "Ветер сдул лепестки!", type: "percent", value: 0.15}
];

// =============================================
// 1b. ПОЛОЖИТЕЛЬНЫЕ СЛУЧАЙНЫЕ СОБЫТИЯ
// =============================================

export const POSITIVE_EVENTS = [
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

export const PREMIUM_ITEMS = [
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
