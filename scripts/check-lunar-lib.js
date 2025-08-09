#!/usr/bin/env node

// 檢查 lunar-javascript 庫的正確使用方式
const Lunar = require('lunar-javascript');

console.log('📚 檢查 lunar-javascript 庫功能\n');

try {
  console.log('=== 基本功能測試 ===');
  
  // 測試從農曆創建日期
  console.log('測試農曆轉國曆：');
  const lunar = Lunar.fromYmdHms(2025, 8, 12, 0, 0, 0); // 農曆八月十二
  const solar = lunar.getSolar();
  
  console.log(`農曆：2025年8月12日`);
  console.log(`國曆：${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`);
  console.log(`格式化：${solar.toYmd()}`);
  
  // 測試閏月檢查
  console.log('\n測試閏月檢查：');
  const year2025 = Lunar.fromDate(new Date(2025, 0, 1));
  const leapMonth = year2025.getLeapMonth();
  console.log(`2025年閏月：${leapMonth > 0 ? `閏${leapMonth}月` : '無閏月'}`);
  
  // 測試更多日期
  console.log('\n=== 多個日期測試 ===');
  const testDates = [
    { month: 1, day: 1, name: '農曆新年' },
    { month: 3, day: 23, name: '媽祖聖誕' },
    { month: 5, day: 5, name: '端午節' },
    { month: 8, day: 15, name: '中秋節' }
  ];
  
  testDates.forEach(test => {
    try {
      const testLunar = Lunar.fromYmdHms(2025, test.month, test.day, 0, 0, 0);
      const testSolar = testLunar.getSolar();
      console.log(`${test.name}: 農曆${test.month}/${test.day} → 國曆${testSolar.toYmd()}`);
    } catch (error) {
      console.log(`${test.name}: 轉換失敗 - ${error.message}`);
    }
  });
  
  console.log('\n✅ lunar-javascript 庫測試完成');
  
} catch (error) {
  console.error('❌ 測試失敗：', error.message);
  console.log('Stack trace:', error.stack);
}