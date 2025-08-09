#!/usr/bin/env node

// 測試正確的 lunar-javascript API
const lunarLib = require('lunar-javascript');

console.log('🧪 測試正確的農曆轉換 API\n');

try {
  console.log('=== 農曆轉國曆測試 ===');
  
  // 正確的使用方式
  const { Lunar } = lunarLib;
  
  console.log('Lunar class methods:', Object.getOwnPropertyNames(Lunar).filter(name => typeof Lunar[name] === 'function'));
  
  // 嘗試創建農曆日期
  if (Lunar.fromYmdHms) {
    const lunar = Lunar.fromYmdHms(2025, 8, 12, 0, 0, 0);
    console.log('農曆日期創建成功:', lunar);
    
    if (lunar && lunar.getSolar) {
      const solar = lunar.getSolar();
      console.log('轉換為國曆:', solar);
      console.log('國曆日期:', solar.toYmd());
    }
  } else {
    console.log('❌ fromYmdHms 方法不存在');
    
    // 嘗試其他可能的方法
    const possibleMethods = Object.getOwnPropertyNames(Lunar)
      .filter(name => typeof Lunar[name] === 'function')
      .filter(name => name.toLowerCase().includes('from') || name.toLowerCase().includes('ymd'));
    
    console.log('可能的創建方法:', possibleMethods);
    
    possibleMethods.forEach(method => {
      try {
        console.log(`嘗試 ${method}...`);
        const result = Lunar[method](2025, 8, 12);
        console.log(`✅ ${method} 成功:`, result);
        
        if (result && result.getSolar) {
          const solar = result.getSolar();
          console.log('   轉換結果:', solar.toYmd());
        }
      } catch (error) {
        console.log(`❌ ${method} 失敗:`, error.message);
      }
    });
  }
  
} catch (error) {
  console.error('❌ 測試失敗：', error.message);
  console.log('Stack trace:', error.stack);
}