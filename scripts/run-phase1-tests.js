#!/usr/bin/env node

// Phase 1 測試運行腳本
// 運行四類型 CRUD smoke 測試並生成報告

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Phase 1 - 四類型 CRUD Smoke 測試');
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

console.log('🔧 測試環境設定:');
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   - ENFORCE_DB_WRITES: ${process.env.ENFORCE_DB_WRITES}`);
console.log(`   - READ_FALLBACK: ${process.env.READ_FALLBACK}`);
console.log(`   - Supabase URL: ${process.env.SUPABASE_URL?.slice(0, 30)}...`);
console.log('');

try {
  // 運行測試
  console.log('📋 執行測試...\n');
  
  const testFile = path.join(__dirname, '..', 'tests', 'phase1-crud-smoke.test.js');
  
  execSync(`npx jest "${testFile}" --verbose --detectOpenHandles --forceExit`, {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('\n✅ Phase 1 測試完成！');
  console.log('\n📊 驗收檢查:');
  console.log('   - [✓] 四類型 CRUD 穩定 2xx');
  console.log('   - [✓] X-Data-Source 都是 supabase');
  console.log('   - [✓] 錯誤訊息結構化 {status, message, details}');
  console.log('   - [✓] 無記憶體假成功');

} catch (error) {
  console.log('\n❌ Phase 1 測試失敗！');
  console.log('\n錯誤詳情:');
  console.log(error.message);
  
  console.log('\n🔧 可能的解決方案:');
  console.log('   1. 確認 Supabase 連線正常');
  console.log('   2. 執行 migration: supabase db reset');
  console.log('   3. 檢查環境變數是否正確設定');
  console.log('   4. 確認 API server 正在運行');
  
  process.exit(1);
}