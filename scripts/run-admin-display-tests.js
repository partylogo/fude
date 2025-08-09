#!/usr/bin/env node
// 運行 Admin 顯示對齊測試

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🧪 運行 Admin 顯示對齊測試...');
console.log('📁 測試路徑:', resolve(projectRoot, 'tests/admin-display.test.js'));

// 設置環境變數
const env = {
  ...process.env,
  NODE_ENV: 'test',
  API_URL: process.env.API_URL || 'http://localhost:3000/api'
};

const testProcess = spawn('npx', ['vitest', 'run', 'tests/admin-display.test.js'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Admin 顯示對齊測試通過');
  } else {
    console.log('❌ Admin 顯示對齊測試失敗');
    process.exit(code);
  }
});

testProcess.on('error', (error) => {
  console.error('測試執行錯誤:', error);
  process.exit(1);
});