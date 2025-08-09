#!/usr/bin/env node

// 探索 lunar-javascript 庫的正確 API
const Lunar = require('lunar-javascript');

console.log('🔍 探索 lunar-javascript API\n');

console.log('Lunar object keys:', Object.keys(Lunar));
console.log('Lunar:', typeof Lunar, Lunar.constructor.name);

if (typeof Lunar === 'function') {
  console.log('Trying to create instance...');
  try {
    const instance = new Lunar();
    console.log('Instance created:', instance);
    console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
  } catch (error) {
    console.log('Cannot create instance:', error.message);
  }
}

// 檢查 Lunar 的靜態方法
console.log('\nLunar static methods:');
if (Lunar.prototype) {
  console.log('Prototype methods:', Object.getOwnPropertyNames(Lunar.prototype));
}

// 嘗試不同的初始化方式
console.log('\n=== 嘗試不同的初始化方式 ===');

const possibleMethods = [
  'fromLunar',
  'fromYmd', 
  'fromDate',
  'lunar',
  'Lunar',
  'create',
  'new'
];

possibleMethods.forEach(method => {
  if (Lunar[method] && typeof Lunar[method] === 'function') {
    console.log(`✅ Found method: Lunar.${method}`);
    try {
      const result = Lunar[method](2025, 8, 12);
      console.log(`   Result type: ${typeof result}, constructor: ${result?.constructor?.name}`);
      if (result && typeof result === 'object') {
        console.log(`   Methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(result)).slice(0, 5).join(', ')}...`);
      }
    } catch (error) {
      console.log(`   ❌ Error calling ${method}: ${error.message}`);
    }
  }
});

// 檢查是否是類而不是函數
if (typeof Lunar === 'object' && Lunar !== null) {
  console.log('\nLunar is an object, checking properties:');
  for (const [key, value] of Object.entries(Lunar)) {
    console.log(`  ${key}: ${typeof value}`);
    if (typeof value === 'function' && key.includes('from') || key.includes('lunar')) {
      console.log(`    - Trying ${key}...`);
      try {
        const result = value(2025, 8, 12);
        console.log(`      ✅ Success: ${result}`);
      } catch (error) {
        console.log(`      ❌ Failed: ${error.message}`);
      }
    }
  }
}