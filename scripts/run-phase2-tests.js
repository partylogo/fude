#!/usr/bin/env node

// Phase 2 測試運行腳本
// 運行 event_occurrences 系統測試並生成報告

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Phase 2 - Event Occurrences 系統測試');
console.log('==========================================\n');

// 檢查環境變數
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ 缺少必要的環境變數:');
  console.log('   - SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n請在 .env 文件中設定這些變數');
  process.exit(1);
}

// 設定測試環境變數
process.env.NODE_ENV = 'test';
process.env.ENFORCE_DB_WRITES = 'true';  // 啟用嚴格模式
process.env.READ_FALLBACK = 'false';     // 禁用讀取 fallback
process.env.EXTEND_YEARS = '5';          // 設定擴展年數

console.log('🔧 測試環境設定:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   - ENFORCE_DB_WRITES: ${process.env.ENFORCE_DB_WRITES}`);
console.log(`   - READ_FALLBACK: ${process.env.READ_FALLBACK}`);
console.log(`   - EXTEND_YEARS: ${process.env.EXTEND_YEARS}`);
console.log(`   - Supabase URL: ${process.env.SUPABASE_URL?.slice(0, 30)}...`);
console.log('');

try {
  // 運行 Phase 2 測試
  console.log('📋 執行 Phase 2 測試...\n');
  
  const testFile = path.join(__dirname, '..', 'tests', 'phase2-occurrences.test.js');
  
  execSync(`npx jest "${testFile}" --verbose --detectOpenHandles --forceExit --testTimeout=30000`, {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('\n✅ Phase 2 測試完成！');
  console.log('\n📊 驗收檢查:');
  console.log('   - [✓] event_occurrences 表正常創建並生成 5 年資料');
  console.log('   - [✓] festival/custom 類型自動生成 occurrences');
  console.log('   - [✓] v1 API 維持 solar_date 相容輸出');
  console.log('   - [✓] v2 API 提供 next_occurrence_date');
  console.log('   - [✓] 事件 CRUD 自動處理 occurrences');

  console.log('\n🎯 Phase 2 成就解鎖:');
  console.log('   - 🗓️  SSOT 日期系統：從規則 → occurrences 的轉換');
  console.log('   - 🔄 自動化流程：創建/更新事件自動生成日期');
  console.log('   - 🎛️  版本化 API：v1 相容 + v2 增強功能');
  console.log('   - ⚡ 效能優化：預生成避免即時計算');

} catch (error) {
  console.log('\n❌ Phase 2 測試失敗！');
  console.log('\n錯誤詳情:');
  console.log(error.message);
  
  console.log('\n🔧 可能的解決方案:');
  console.log('   1. 確認 Supabase 連線正常');
  console.log('   2. 執行 migration: supabase db reset');
  console.log('   3. 檢查 event_occurrences 表是否正確創建');
  console.log('   4. 驗證外鍵約束是否設定正確');
  console.log('   5. 確認 API server 正在運行');
  
  console.log('\n🗣️ 常見問題:');
  console.log('   - 外鍵約束錯誤：確認 events 表有 UNIQUE(id, rule_version)');
  console.log('   - 日期生成錯誤：檢查 EXTEND_YEARS 環境變數');
  console.log('   - API 版本錯誤：確認 API-Version 標頭處理');
  
  process.exit(1);
}