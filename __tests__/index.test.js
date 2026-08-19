/**
 * Автотесты для логики игры «Пепа: Симулятор Болота»
 * Покрывают все чистые функции и редюсеры.
 */

import {
  UPGRADES, CLICK_PENALTIES, POSITIVE_EVENTS, PREMIUM_ITEMS, EVENT_IMAGE
} from "../src/data/gameData.js";
import {
  initialState,
  calculatePenalty,
  calculatePositiveBonus,
  tickReducer,
  buyUpgradeReducer,
  buyPremiumReducer,
  buyDiamondsReducer
} from "../src/reducers/index.js";
import { formatNum, formatTime, getUpgradeCost } from "../src/utils/formatters.js";
import { renderShop, renderPremiumShop, renderEffects } from "../src/ui/renderers.js";

// ========================================================
// 1. Тесты данных (gameData)
// ========================================================

describe("Данные игры", () => {
  test("UPGRADES содержит 5 улучшений с уникальными id", () => {
    expect(UPGRADES).toHaveLength(5);
    const ids = UPGRADES.map(u => u.id);
    expect(new Set(ids).size).toBe(5);
  });

  test("Каждое улучшение имеет обязательные поля", () => {
    UPGRADES.forEach(upg => {
      expect(upg).toHaveProperty("id");
      expect(upg).toHaveProperty("name");
      expect(upg).toHaveProperty("baseCost");
      expect(upg).toHaveProperty("costMult");
      expect(upg).toHaveProperty("desc");
      expect(upg).toHaveProperty("debuffDesc");
      expect(upg).toHaveProperty("apply");
      expect(typeof upg.apply).toBe("function");
    });
  });

  test("CLICK_PENALTIES содержит 5 штрафов", () => {
    expect(CLICK_PENALTIES).toHaveLength(5);
    CLICK_PENALTIES.forEach(p => {
      expect(["flat", "percent"]).toContain(p.type);
      expect(p.value).toBeGreaterThan(0);
      expect(p.text).toBeTruthy();
    });
  });

  test("POSITIVE_EVENTS содержит 7 событий", () => {
    expect(POSITIVE_EVENTS).toHaveLength(7);
  });

  test("PREMIUM_ITEMS содержит 6 предметов", () => {
    expect(PREMIUM_ITEMS).toHaveLength(6);
    const ids = PREMIUM_ITEMS.map(i => i.id);
    expect(ids).toContain("shield");
    expect(ids).toContain("antidepressant");
    expect(ids).toContain("luck_potion");
    expect(ids).toContain("talisman");
    expect(ids).toContain("energy");
    expect(ids).toContain("tax_free");
  });

  test("EVENT_IMAGE содержит buff и debuff", () => {
    expect(EVENT_IMAGE).toHaveLength(2);
    expect(EVENT_IMAGE[0].name).toBe("buff");
    expect(EVENT_IMAGE[1].name).toBe("debuff");
  });
});

// ========================================================
// 2. initialState
// ========================================================

describe("initialState", () => {
  test("возвращает объект с корректными значениями по умолчанию", () => {
    const s = initialState();
    expect(s.lotuses).toBe(0);
    expect(s.totalEarned).toBe(0);
    expect(s.clickPower).toBe(5);
    expect(s.passiveIncome).toBe(0);
    expect(s.passiveMult).toBe(1.0);
    expect(s.stealChance).toBe(0);
    expect(s.taxRate).toBe(0);
    expect(s.hasDepression).toBe(false);
    expect(s.depressionTimer).toBe(0);
    expect(s.ownedUpgrades).toEqual([]);
    expect(s.activeEffects).toEqual([]);
    expect(s.diamonds).toBe(100);
    expect(s.positiveChance).toBe(0.05);
    expect(s.talismanCount).toBe(0);
    expect(s.tempClickBuff).toBe(1);
    expect(s.tempClickBuffTimer).toBe(0);
    expect(s.tempPassiveBuff).toBe(0);
    expect(s.tempPassiveBuffTimer).toBe(0);
    expect(s.shieldTimer).toBe(0);
    expect(s.antidepressantTimer).toBe(0);
    expect(s.luckPotionTimer).toBe(0);
    expect(s.energyTimer).toBe(0);
    expect(s.taxExemptionTimer).toBe(0);
  });

  test("каждый вызов возвращает новый объект", () => {
    const a = initialState();
    const b = initialState();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ========================================================
// 3. calculatePenalty
// ========================================================

describe("calculatePenalty", () => {
  test("flat-штраф: возвращает min(lotuses, value)", () => {
    expect(calculatePenalty(100, {type: "flat", value: 15})).toBe(15);
    expect(calculatePenalty(10, {type: "flat", value: 15})).toBe(10);
    expect(calculatePenalty(0, {type: "flat", value: 15})).toBe(0);
  });

  test("percent-штраф: возвращает floor(lotuses * value)", () => {
    expect(calculatePenalty(100, {type: "percent", value: 0.2})).toBe(20);
    expect(calculatePenalty(100, {type: "percent", value: 0.4})).toBe(40);
    expect(calculatePenalty(7, {type: "percent", value: 0.15})).toBe(1); // floor(1.05) = 1
    expect(calculatePenalty(0, {type: "percent", value: 0.2})).toBe(0);
  });

  test("все CLICK_PENALTIES дают результат >= 0", () => {
    CLICK_PENALTIES.forEach(p => {
      const result = calculatePenalty(500, p);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result)).toBe(true);
    });
  });
});

// ========================================================
// 4. calculatePositiveBonus
// ========================================================

describe("calculatePositiveBonus", () => {
  const baseState = initialState();

  test("click_mult: bonus = baseClick * value", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "click_mult");
    const result = calculatePositiveBonus(baseState, event);
    // clickPower=5, energyTimer=0, tempClickBuff=1 => baseClick=5
    expect(result.bonus).toBe(5 * 3); // value=3
    expect(result.text).toContain("+3x");
  });

  test("flat_bonus: bonus = value", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "flat_bonus");
    const result = calculatePositiveBonus(baseState, event);
    expect(result.bonus).toBe(25);
    expect(result.text).toContain("+25");
  });

  test("percent_bonus: bonus = max(1, floor(lotuses * value))", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "percent_bonus");
    const state = {...baseState, lotuses: 200};
    const result = calculatePositiveBonus(state, event);
    expect(result.bonus).toBe(20); // floor(200*0.1)=20
  });

  test("percent_bonus: минимум 1", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "percent_bonus");
    const state = {...baseState, lotuses: 0};
    const result = calculatePositiveBonus(state, event);
    expect(result.bonus).toBe(1); // max(1, 0) = 1
  });

  test("mega_click: bonus = value", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "mega_click");
    const result = calculatePositiveBonus(baseState, event);
    expect(result.bonus).toBe(10);
    expect(result.text).toContain("МЕГА");
  });

  test("temp_click_buff: bonus=0, возвращает tempClickBuff и duration", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "temp_click_buff");
    const result = calculatePositiveBonus(baseState, event);
    expect(result.bonus).toBe(0);
    expect(result.tempClickBuff).toBeGreaterThan(1);
    expect(result.tempClickBuffDuration).toBeGreaterThan(0);
    expect(result.text).toContain("с!");
  });

  test("temp_passive_buff: bonus=0, возвращает tempPassiveBuff и duration", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "temp_passive_buff");
    const result = calculatePositiveBonus(baseState, event);
    expect(result.bonus).toBe(0);
    expect(result.tempPassiveBuff).toBeGreaterThan(0);
    expect(result.tempPassiveBuffDuration).toBeGreaterThan(0);
    expect(result.text).toContain("/сек");
  });

  test("неизвестный тип: bonus=0, text=''", () => {
    const result = calculatePositiveBonus(baseState, {type: "unknown"});
    expect(result.bonus).toBe(0);
    expect(result.text).toBe("");
  });

  test("click_mult учитывает energyTimer x3", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "click_mult");
    const state = {...baseState, energyTimer: 10};
    const result = calculatePositiveBonus(state, event);
    // baseClick = 5 * 3 * 1 = 15; bonus = 15 * 3 = 45
    expect(result.bonus).toBe(45);
  });

  test("click_mult учитывает tempClickBuff", () => {
    const event = POSITIVE_EVENTS.find(e => e.type === "click_mult");
    const state = {...baseState, tempClickBuff: 2};
    const result = calculatePositiveBonus(state, event);
    // baseClick = 5 * 1 * 2 = 10; bonus = 10 * 3 = 30
    expect(result.bonus).toBe(30);
  });
});

// ========================================================
// 5. tickReducer
// ========================================================

describe("tickReducer", () => {
  test("начисляет пассивный доход", () => {
    const state = {...initialState(), passiveIncome: 10, passiveMult: 1};
    const next = tickReducer(state, 1000); // 1 секунда
    expect(next.lotuses).toBe(10);
    expect(next.totalEarned).toBe(10);
  });

  test("пассивный доход с multiplier", () => {
    const state = {...initialState(), passiveIncome: 10, passiveMult: 2};
    const next = tickReducer(state, 1000);
    expect(next.lotuses).toBe(20);
  });

  test("пассивный доход за полсекунды", () => {
    const state = {...initialState(), passiveIncome: 10};
    const next = tickReducer(state, 500);
    expect(next.lotuses).toBe(5);
  });

  test("налог уменьшает пассивный доход, но lotuses >= 0", () => {
    const state = {...initialState(), lotuses: 1000, taxRate: 0.05, passiveIncome: 10};
    const next = tickReducer(state, 1000);
    // rawPassive = 10*1*1=10, tax = 1000*0.05*1=50, finalPassive = max(0, 10-50)=0
    expect(next.lotuses).toBe(1000);
    expect(next.totalEarned).toBe(10); // totalEarned считает rawPassive без налога
  });

  test("taxExemptionTimer отменяет налог", () => {
    const state = {
      ...initialState(),
      lotuses: 1000,
      taxRate: 0.05,
      taxExemptionTimer: 90,
      passiveIncome: 10
    };
    const next = tickReducer(state, 1000);
    // Без налога: 1000 + 10*1*1 = 1010
    expect(next.lotuses).toBe(1010);
  });

  test("декрементирует таймеры", () => {
    const state = {
      ...initialState(),
      shieldTimer: 10,
      antidepressantTimer: 20,
      luckPotionTimer: 30,
      energyTimer: 40,
      taxExemptionTimer: 50,
      tempClickBuffTimer: 5,
      tempPassiveBuffTimer: 15
    };
    const next = tickReducer(state, 1000);
    expect(next.shieldTimer).toBe(9);
    expect(next.antidepressantTimer).toBe(19);
    expect(next.luckPotionTimer).toBe(29);
    expect(next.energyTimer).toBe(39);
    expect(next.taxExemptionTimer).toBe(49);
    expect(next.tempClickBuffTimer).toBe(4);
    expect(next.tempPassiveBuffTimer).toBe(14);
  });

  test("таймеры не уходят в минус", () => {
    const state = {...initialState(), shieldTimer: 0.5};
    const next = tickReducer(state, 1000);
    expect(next.shieldTimer).toBe(0);
  });

  test("tempClickBuff сбрасывается в 1 при истечении таймера", () => {
    const state = {
      ...initialState(),
      tempClickBuff: 3,
      tempClickBuffTimer: 0.5,
      activeEffects: ["temp_click"]
    };
    const next = tickReducer(state, 1000);
    expect(next.tempClickBuff).toBe(1);
    expect(next.activeEffects).not.toContain("temp_click");
  });

  test("tempPassiveBuff сбрасывается в 0 при истечении таймера", () => {
    const state = {
      ...initialState(),
      tempPassiveBuff: 5,
      tempPassiveBuffTimer: 0.5,
      passiveIncome: 0,
      activeEffects: ["temp_passive"]
    };
    const next = tickReducer(state, 1000);
    expect(next.tempPassiveBuff).toBe(0);
    expect(next.activeEffects).not.toContain("temp_passive");
  });

  test("lotuses не уходит в минус", () => {
    const state = {
      ...initialState(),
      lotuses: 5,
      taxRate: 1.0
    };
    const next = tickReducer(state, 1000);
    expect(next.lotuses).toBeGreaterThanOrEqual(0);
  });

  test("добавляет активные эффекты для включённых таймеров", () => {
    const state = {
      ...initialState(),
      shieldTimer: 10,
      antidepressantTimer: 10,
      luckPotionTimer: 10,
      energyTimer: 10,
      taxExemptionTimer: 10,
      activeEffects: []
    };
    const next = tickReducer(state, 100);
    expect(next.activeEffects).toContain("shield");
    expect(next.activeEffects).toContain("antidepressant");
    expect(next.activeEffects).toContain("luck_potion");
    expect(next.activeEffects).toContain("energy");
    expect(next.activeEffects).toContain("tax_free");
  });

  test("убирает эффекты при истёкших таймерах", () => {
    const state = {
      ...initialState(),
      shieldTimer: 0,
      antidepressantTimer: 0,
      luckPotionTimer: 0,
      energyTimer: 0,
      taxExemptionTimer: 0,
      activeEffects: ["shield", "antidepressant", "luck_potion", "energy", "tax_free"]
    };
    const next = tickReducer(state, 100);
    expect(next.activeEffects).not.toContain("shield");
    expect(next.activeEffects).not.toContain("antidepressant");
    expect(next.activeEffects).not.toContain("luck_potion");
    expect(next.activeEffects).not.toContain("energy");
    expect(next.activeEffects).not.toContain("tax_free");
  });

  test("не мутирует входное состояние", () => {
    const state = {...initialState(), passiveIncome: 10, activeEffects: []};
    const copy = JSON.parse(JSON.stringify(state));
    tickReducer(state, 1000);
    expect(state).toEqual(copy);
  });

  test("finalPassive не меньше 0", () => {
    const state = {
      ...initialState(),
      lotuses: 10000,
      taxRate: 0.5,
      passiveIncome: 1
    };
    const next = tickReducer(state, 1000);
    expect(next.lotuses).toBeGreaterThanOrEqual(0);
  });
});

// ========================================================
// 6. buyUpgradeReducer
// ========================================================

describe("buyUpgradeReducer", () => {
  test("покупка первого улучшения (mushroom): списывает лотосы, применяет эффект", () => {
    const state = {...initialState(), lotuses: 100};
    const next = buyUpgradeReducer(state, "mushroom");
    expect(next.lotuses).toBe(85); // 100 - 15
    expect(next.clickPower).toBe(7); // 5 + 2
    expect(next.passiveMult).toBe(0.8); // 1.0 * 0.8
    expect(next.ownedUpgrades).toContain("mushroom");
  });

  test("нельзя купить с недостатком средств", () => {
    const state = {...initialState(), lotuses: 5};
    const next = buyUpgradeReducer(state, "mushroom");
    expect(next).toBe(state); // тот же объект (no change)
    expect(next.ownedUpgrades).toEqual([]);
  });

  test("нельзя купить уже купленное улучшение", () => {
    const state = {
      ...initialState(),
      lotuses: 10000,
      ownedUpgrades: ["mushroom"]
    };
    const next = buyUpgradeReducer(state, "mushroom");
    expect(next).toBe(state);
  });

  test("нельзя купить несуществующее улучшение", () => {
    const state = {...initialState(), lotuses: 99999};
    const next = buyUpgradeReducer(state, "nonexistent");
    expect(next).toBe(state);
  });

  test("стоимость растёт с числом купленных", () => {
    // Первое: 15, второе: floor(50 * 1.6^1) = 80
    const state = {...initialState(), lotuses: 1000, ownedUpgrades: ["mushroom"]};
    const next = buyUpgradeReducer(state, "sigh");
    expect(next.lotuses).toBe(1000 - 80);
    expect(next.ownedUpgrades).toContain("sigh");
  });

  test("покупка 'sigh': +1 passive, -1 click (min 1)", () => {
    const state = {...initialState(), lotuses: 200};
    const next = buyUpgradeReducer(state, "sigh");
    expect(next.passiveIncome).toBe(1);
    expect(next.clickPower).toBe(4); // 5-1
  });

  test("покупка 'zhabych_guard': +5 passive, +0.15 stealChance", () => {
    // cost = floor(200 * 1.7^2) = 578
    const state = {...initialState(), lotuses: 1000, ownedUpgrades: ["mushroom", "sigh"]};
    const next = buyUpgradeReducer(state, "zhabych_guard");
    expect(next.passiveIncome).toBe(5); // 0 + 5 (ownedUpgrades не применяет эффекты прошлых покупок)
    expect(next.stealChance).toBeCloseTo(0.15);
    expect(next.ownedUpgrades).toContain("zhabych_guard");
  });

  test("покупка 'sad_playlist': x2 passiveMult, hasDepression=true", () => {
    // cost = floor(1000 * 1.8^3) = 5832
    const state = {
      ...initialState(),
      lotuses: 10000,
      ownedUpgrades: ["mushroom", "sigh", "zhabych_guard"]
    };
    const next = buyUpgradeReducer(state, "sad_playlist");
    expect(next.hasDepression).toBe(true);
    // passiveMult начальный 1.0, *2 = 2.0
    expect(next.passiveMult).toBe(2.0);
    expect(next.ownedUpgrades).toContain("sad_playlist");
  });

  test("покупка 'swamp_tears': +10 clickPower, +0.05 taxRate", () => {
    // cost = floor(5000 * 2.0^4) = 80000
    const state = {
      ...initialState(),
      lotuses: 100000,
      ownedUpgrades: ["mushroom", "sigh", "zhabych_guard", "sad_playlist"]
    };
    const next = buyUpgradeReducer(state, "swamp_tears");
    // clickPower начальный 5; +10 = 15
    expect(next.clickPower).toBe(15);
    expect(next.taxRate).toBeCloseTo(0.05);
    expect(next.ownedUpgrades).toContain("swamp_tears");
  });
});

// ========================================================
// 7. buyPremiumReducer
// ========================================================

describe("buyPremiumReducer", () => {
  test("покупка shield: списывает 50 алмазов, устанавливает shieldTimer=60", () => {
    const state = {...initialState(), diamonds: 100};
    const next = buyPremiumReducer(state, "shield");
    expect(next.diamonds).toBe(50);
    expect(next.shieldTimer).toBe(60);
  });

  test("покупка antidepressant: -30 алмазов, antidepressantTimer=120", () => {
    const state = {...initialState(), diamonds: 100};
    const next = buyPremiumReducer(state, "antidepressant");
    expect(next.diamonds).toBe(70);
    expect(next.antidepressantTimer).toBe(120);
  });

  test("покупка luck_potion: -100 алмазов, luckPotionTimer=45", () => {
    const state = {...initialState(), diamonds: 200};
    const next = buyPremiumReducer(state, "luck_potion");
    expect(next.diamonds).toBe(100);
    expect(next.luckPotionTimer).toBe(45);
  });

  test("покупка energy: -40 алмазов, energyTimer=30", () => {
    const state = {...initialState(), diamonds: 100};
    const next = buyPremiumReducer(state, "energy");
    expect(next.diamonds).toBe(60);
    expect(next.energyTimer).toBe(30);
  });

  test("покупка tax_free: -60 алмазов, taxExemptionTimer=90", () => {
    const state = {...initialState(), diamonds: 100};
    const next = buyPremiumReducer(state, "tax_free");
    expect(next.diamonds).toBe(40);
    expect(next.taxExemptionTimer).toBe(90);
  });

  test("покупка talisman: постоянное улучшение, +8% к шансу", () => {
    const state = {...initialState(), diamonds: 100};
    const next = buyPremiumReducer(state, "talisman");
    expect(next.diamonds).toBe(25);
    expect(next.talismanCount).toBe(1);
    expect(next.positiveChance).toBeCloseTo(0.13); // 0.05 + 1*0.08
  });

  test("talisman складывается при повторной покупке", () => {
    const state = {...initialState(), diamonds: 200, talismanCount: 2, positiveChance: 0.21};
    const next = buyPremiumReducer(state, "talisman");
    expect(next.talismanCount).toBe(3);
    expect(next.positiveChance).toBeCloseTo(0.29); // 0.05 + 3*0.08
  });

  test("нельзя купить без алмазов", () => {
    const state = {...initialState(), diamonds: 10};
    const next = buyPremiumReducer(state, "shield");
    expect(next).toBe(state);
  });

  test("нельзя купить несуществующий предмет", () => {
    const state = {...initialState(), diamonds: 999};
    const next = buyPremiumReducer(state, "nonexistent");
    expect(next).toBe(state);
  });

  test("повторная активация таймерного предмета продлевает таймер", () => {
    const state = {...initialState(), diamonds: 200, shieldTimer: 5};
    const next = buyPremiumReducer(state, "shield");
    expect(next.shieldTimer).toBe(60); // перезаписывается
  });
});

// ========================================================
// 8. buyDiamondsReducer
// ========================================================

describe("buyDiamondsReducer", () => {
  test("добавляет алмазы", () => {
    const state = {...initialState()};
    const next = buyDiamondsReducer(state, 50);
    expect(next.diamonds).toBe(150);
  });

  test("не мутирует оригинальное состояние", () => {
    const state = {...initialState()};
    buyDiamondsReducer(state, 50);
    expect(state.diamonds).toBe(100);
  });
});

// ========================================================
// 9. formatNum
// ========================================================

describe("formatNum", () => {
  test("числа < 1000 — целое", () => {
    expect(formatNum(0)).toBe("0");
    expect(formatNum(5)).toBe("5");
    expect(formatNum(999)).toBe("999");
  });

  test("дробные числа округляются вниз", () => {
    expect(formatNum(5.7)).toBe("5");
    expect(formatNum(999.9)).toBe("999");
  });

  test("1000+ — K", () => {
    expect(formatNum(1000)).toBe("1.0K");
    expect(formatNum(1500)).toBe("1.5K");
    expect(formatNum(999999)).toBe("1000.0K");
  });

  test("1000000+ — M", () => {
    expect(formatNum(1000000)).toBe("1.0M");
    expect(formatNum(2500000)).toBe("2.5M");
  });

  test("1000000000+ — B", () => {
    expect(formatNum(1000000000)).toBe("1.0B");
  });
});

// ========================================================
// 10. formatTime
// ========================================================

describe("formatTime", () => {
  test("0 или отрицательное — пустая строка", () => {
    expect(formatTime(0)).toBe("");
    expect(formatTime(-5)).toBe("");
  });

  test("секунды < 60", () => {
    expect(formatTime(5)).toBe("5с");
    expect(formatTime(0.3)).toBe("1с"); // ceil
  });

  test("минуты и секунды", () => {
    expect(formatTime(90)).toBe("1:30");
    expect(formatTime(61)).toBe("1:01");
    expect(formatTime(120)).toBe("2:00");
    expect(formatTime(3600)).toBe("60:00");
  });
});

// ========================================================
// 11. getUpgradeCost
// ========================================================

describe("getUpgradeCost", () => {
  test("базовая стоимость mushroom при 0 купленных", () => {
    expect(getUpgradeCost("mushroom", 0)).toBe(15);
  });

  test("стоительность растёт с ownedCount", () => {
    const c0 = getUpgradeCost("mushroom", 0);
    const c1 = getUpgradeCost("mushroom", 1);
    const c2 = getUpgradeCost("mushroom", 2);
    expect(c1).toBeGreaterThan(c0);
    expect(c2).toBeGreaterThan(c1);
  });

  test("всегда целое число", () => {
    for (let i = 0; i < 10; i++) {
      const cost = getUpgradeCost("sigh", i);
      expect(Number.isInteger(cost)).toBe(true);
    }
  });
});

// ========================================================
// 12. renderShop
// ========================================================

describe("renderShop", () => {
  test("возвращает HTML-строку с 5 карточками", () => {
    const state = initialState();
    const html = renderShop(state);
    expect(html).toContain("upgrade-card");
    expect(html).toContain("Мороженка");
    expect(html).toContain("Пистолет");
    expect(html).toContain("Копиум");
    expect(html).toContain("Обнимашки");
    expect(html).toContain("Я Бэтмен");
  });

  test("купленное улучшение имеет класс owned", () => {
    const state = {...initialState(), ownedUpgrades: ["mushroom"]};
    const html = renderShop(state);
    // Карточка mushroom содержит класс owned
    const mushroomIdx = html.indexOf("Мороженка");
    const nextCard = html.indexOf("upgrade-card", mushroomIdx + 10);
    const ownedIdx = html.indexOf("owned");
    // «owned» должен появиться для первой карточки (mushroom)
    expect(html.substring(0, nextCard > 0 ? nextCard : html.length)).toContain("owned");
  });

  test("кнопка disabled если не хватает лотосов", () => {
    const state = {...initialState(), lotuses: 0};
    const html = renderShop(state);
    // Все кнопки должны быть disabled
    const disabledCount = (html.match(/disabled/g) || []).length;
    expect(disabledCount).toBe(5);
  });
});

// ========================================================
// 13. renderPremiumShop
// ========================================================

describe("renderPremiumShop", () => {
  test("возвращает HTML-строку с 6 карточками", () => {
    const state = initialState();
    const html = renderPremiumShop(state);
    expect(html).toContain("premium-card");
    expect(html).toContain("Щит от Жабыча");
    expect(html).toContain("Антидепрессант");
    expect(html).toContain("Зелье удачи");
    expect(html).toContain("Талисман удачи");
    expect(html).toContain("Энергетик болота");
    expect(html).toContain("Налоговая льгота");
  });

  test("показывает таймер для активного баффа", () => {
    const state = {...initialState(), shieldTimer: 30};
    const html = renderPremiumShop(state);
    expect(html).toContain("⏱");
  });

  test("нет таймера если бафф неактивен", () => {
    const state = initialState();
    const html = renderPremiumShop(state);
    // Для shield карточки таймера быть не должно (но талисман показывает ∞)
    const shieldIdx = html.indexOf("Щит от Жабыча");
    const nextCardIdx = html.indexOf("premium-card", shieldIdx + 10);
    const snippet = html.substring(shieldIdx, nextCardIdx > 0 ? nextCardIdx : html.length);
    expect(snippet).not.toContain("⏱");
  });

  test("текст кнопки — АКТИВНО для активного баффа", () => {
    const state = {...initialState(), shieldTimer: 30};
    const html = renderPremiumShop(state);
    expect(html).toContain("✅ АКТИВНО");
  });
});

// ========================================================
// 14. renderEffects
// ========================================================

describe("renderEffects", () => {
  test("пустой массив эффектов — пустая строка", () => {
    const state = {...initialState(), activeEffects: []};
    expect(renderEffects(state)).toBe("");
  });

  test("депрессия рендерится", () => {
    const state = {...initialState(), activeEffects: ["depression"]};
    const html = renderEffects(state);
    expect(html).toContain("ДЕПРЕССИЯ");
  });

  test("щит рендерится с premium-badge", () => {
    const state = {...initialState(), activeEffects: ["shield"]};
    const html = renderEffects(state);
    expect(html).toContain("ЩИТ ОТ ЖАБЫЧА");
    expect(html).toContain("premium-badge");
  });

  test("несколько эффектов рендерятся без дубликатов", () => {
    const state = {...initialState(), activeEffects: ["shield", "shield", "energy"]};
    const html = renderEffects(state);
    // Set дедуплицирует
    const shieldCount = (html.match(/ЩИТ ОТ ЖАБЫЧА/g) || []).length;
    expect(shieldCount).toBe(1);
    expect(html).toContain("ЭНЕРГЕТИК");
  });

  test("temp_click показывает множитель", () => {
    const state = {...initialState(), activeEffects: ["temp_click"], tempClickBuff: 3};
    const html = renderEffects(state);
    expect(html).toContain("x3");
  });

  test("temp_passive показывает бонус/сек", () => {
    const state = {...initialState(), activeEffects: ["temp_passive"], tempPassiveBuff: 5};
    const html = renderEffects(state);
    expect(html).toContain("+5/сек");
  });

  test("неизвестный эффект игнорируется", () => {
    const state = {...initialState(), activeEffects: ["unknown_effect"]};
    expect(renderEffects(state)).toBe("");
  });
});
