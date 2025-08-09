#!/usr/bin/env node

// 測試進階農曆轉換系統
const AdvancedLunarCalendarService = require('../services/advancedLunarCalendarService');

async function testAdvancedLunar() {
  console.log('🚀 測試進階農曆轉換系統\n');
  
  const lunarService = new AdvancedLunarCalendarService();
  
  // 測試案例
  const testCases = [
    { year: 2025, month: 8, day: 12, isLeap: false, name: '神明生日測試 (農曆八月十二)' },
    { year: 2025, month: 3, day: 23, isLeap: false, name: '媽祖聖誕 (農曆三月二十三)' },
    { year: 2025, month: 1, day: 1, isLeap: false, name: '農曆新年 (農曆正月初一)' },
    { year: 2025, month: 8, day: 15, isLeap: false, name: '中秋節 (農曆八月十五)' },
    { year: 2025, month: 5, day: 5, isLeap: false, name: '端午節 (農曆五月初五)' }
  ];
  
  console.log('=== 農曆轉換測試 ===');
  
  for (const testCase of testCases) {
    console.log(`\n🧪 測試：${testCase.name}`);
    console.log(`   農曆：${testCase.year}年${testCase.month}月${testCase.day}日${testCase.isLeap ? ' (閏月)' : ''}`);
    
    try {
      // 測試新的轉換系統
      const solarDates = await lunarService.convertToSolar({
        year: testCase.year,
        month: testCase.month,
        day: testCase.day,
        isLeap: testCase.isLeap
      }, { useCache: false }); // 第一次不使用快取測試算法
      
      console.log(`   ✅ 國曆：${solarDates[0] || '轉換失敗'}`);
      
      // 測試快取功能
      const cachedSolarDates = await lunarService.convertToSolar({
        year: testCase.year,
        month: testCase.month,
        day: testCase.day,
        isLeap: testCase.isLeap
      }, { useCache: true });
      
      console.log(`   📦 快取：${cachedSolarDates[0] || '無快取'}`);
      
    } catch (error) {
      console.log(`   ❌ 錯誤：${error.message}`);
    }
  }
  
  // 測試批量預載功能
  console.log('\n=== 批量預載測試 ===');
  try {
    console.log('⏳ 開始預載常用農曆日期...');
    await lunarService.preloadCommonLunarDates();
    console.log('✅ 預載完成');
  } catch (error) {
    console.log(`❌ 預載失敗：${error.message}`);
  }
  
  // 測試快取清理
  console.log('\n=== 快取維護測試 ===');
  try {
    console.log('🧹 清理過期快取...');
    await lunarService.cleanExpiredCache();
    console.log('✅ 清理完成');
  } catch (error) {
    console.log(`❌ 清理失敗：${error.message}`);
  }
  
  console.log('\n🎉 進階農曆轉換系統測試完成！');
  
  // 比較新舊系統結果
  console.log('\n=== 系統比較 ===');
  const OldLunarService = require('../services/lunarCalendarService');
  
  const comparisonCase = { month: 8, day: 12, year: 2025 };
  
  try {
    const oldResult = OldLunarService.convertToSolar(comparisonCase);
    const newResult = await lunarService.convertToSolar(comparisonCase);
    
    console.log('農曆八月十二轉換比較：');
    console.log(`  舊系統：${oldResult[0] || '無結果'}`);
    console.log(`  新系統：${newResult[0] || '無結果'}`);
    console.log(`  結果一致：${oldResult[0] === newResult[0] ? '✅' : '❌'}`);
  } catch (error) {
    console.log(`比較測試失敗：${error.message}`);
  }
}

// 執行測試
if (require.main === module) {
  testAdvancedLunar().then(() => {
    console.log('\n✨ 測試完成，程序退出');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ 測試失敗：', error);
    process.exit(1);
  });
}

module.exports = { testAdvancedLunar };