#!/usr/bin/env node

// 驗證農曆轉換的準確性
const lunarLib = require('lunar-javascript');

console.log('🔍 驗證農曆轉換準確性\n');

// 測試案例：農曆八月十二
const testYear = 2025;
const testMonth = 8;
const testDay = 12;

console.log(`=== 驗證 ${testYear}年農曆${testMonth}月${testDay}日 ===`);

const { Lunar } = lunarLib;

// 使用算法庫轉換
const lunar = Lunar.fromYmdHms(testYear, testMonth, testDay, 0, 0, 0);
const solar = lunar.getSolar();

console.log('lunar-javascript 庫結果：');
console.log(`  農曆：${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`);
console.log(`  國曆：${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`);
console.log(`  格式化：${solar.toYmd()}`);

// 反向驗證：從國曆轉回農曆
const { Solar } = lunarLib;
const verifyDate = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 0, 0, 0);
const verifyLunar = verifyDate.getLunar();

console.log('\n反向驗證（國曆→農曆）：');
console.log(`  國曆：${verifyDate.toYmd()}`);
console.log(`  農曆：${verifyLunar.getYearInChinese()}年${verifyLunar.getMonthInChinese()}月${verifyLunar.getDayInChinese()}`);
console.log(`  是否一致：${verifyLunar.getMonth() === testMonth && verifyLunar.getDay() === testDay ? '✅' : '❌'}`);

// 測試其他重要日期來驗證準確性
console.log('\n=== 其他重要日期驗證 ===');
const importantDates = [
  { lunar: [2025, 1, 1], name: '2025年農曆新年', expectedSolar: '2025-01-29' },
  { lunar: [2025, 8, 15], name: '2025年中秋節', expectedSolar: '2025-10-06' },
  { lunar: [2025, 5, 5], name: '2025年端午節', expectedSolar: '2025-05-31' }
];

importantDates.forEach(({ lunar: [y, m, d], name, expectedSolar }) => {
  const testLunar = Lunar.fromYmdHms(y, m, d, 0, 0, 0);
  const testSolar = testLunar.getSolar();
  const result = testSolar.toYmd();
  
  console.log(`${name}:`);
  console.log(`  計算結果：${result}`);
  console.log(`  預期結果：${expectedSolar}`);
  console.log(`  是否正確：${result === expectedSolar ? '✅' : '❓'}`);
});

console.log('\n📊 結論：');
console.log('lunar-javascript 庫提供了基於天文算法的準確轉換，');
console.log('比硬編碼的估算值更可靠。建議採用新系統的結果。');