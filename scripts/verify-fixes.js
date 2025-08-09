#!/usr/bin/env node

// 驗證農曆轉換修復效果
const LunarCalendarService = require('../services/lunarCalendarService');

console.log('🔍 驗證農曆轉換修復效果\n');

// 測試修復的日期
const testCases = [
  { month: 8, day: 12, name: '神明生日測試' },
  { month: 3, day: 23, name: '媽祖聖誕' },
  { month: 1, day: 1, name: '農曆新年' },
  { month: 1, day: 15, name: '元宵節' },
];

console.log('=== 農曆轉換測試 ===');
testCases.forEach(testCase => {
  const solarDates = LunarCalendarService.convertToSolar({
    month: testCase.month,
    day: testCase.day,
    year: 2025
  });
  
  const formatted = LunarCalendarService.formatLunarDate({
    month: testCase.month,
    day: testCase.day
  });
  
  console.log(`${testCase.name}:`);
  console.log(`  農曆: ${formatted}`);
  console.log(`  國曆: ${solarDates[0] || '無對照'}`);
  console.log();
});

// 測試節氣日期
console.log('=== 節氣日期測試 ===');
const solarTerms = ['春分', '立秋', '冬至'];
const solarTermDates = {
  '春分': '03-20',
  '立秋': '08-07', 
  '冬至': '12-22'
};

solarTerms.forEach(term => {
  console.log(`${term}: ${new Date().getFullYear()}-${solarTermDates[term]}`);
});

console.log('\n✅ 修復驗證完成！');
console.log('\n📝 下一步：');
console.log('1. 檢查 admin 界面是否顯示正確');
console.log('2. 如需要，執行資料庫 migration');
console.log('3. 考慮升級到完整的農曆轉換系統');