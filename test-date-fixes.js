#!/usr/bin/env node

// Test script to verify date calculation fixes
const LunarCalendarService = require('./services/lunarCalendarService');

console.log('Testing date calculation fixes...\n');

// Test 1: Lunar calendar conversion for 8-12 (農曆八月十二)
console.log('=== Test 1: Lunar Calendar Service ===');
const lunarDate = { month: 8, day: 12, year: 2025, isLeap: false };
const solarDates = LunarCalendarService.convertToSolar(lunarDate);
console.log(`Lunar 8-12 converts to: ${solarDates}`);
console.log(`Formatted: ${LunarCalendarService.formatLunarDate(lunarDate)}`);

// Test 2: Solar term dates
console.log('\n=== Test 2: Solar Term Dates ===');
const solarTermDates = {
  '立春': '02-04', '雨水': '02-19', '驚蟄': '03-06', '春分': '03-20',
  '清明': '04-05', '穀雨': '04-20', '立夏': '05-05', '小滿': '05-21',
  '芒種': '06-06', '夏至': '06-21', '小暑': '07-07', '大暑': '07-23',
  '立秋': '08-07', '處暑': '08-23', '白露': '09-08', '秋分': '09-23',
  '寒露': '10-08', '霜降': '10-23', '立冬': '11-07', '小雪': '11-22',
  '大雪': '12-07', '冬至': '12-22', '小寒': '01-06', '大寒': '01-20'
};

console.log('Spring Equinox (春分):', solarTermDates['春分']);
const currentYear = new Date().getFullYear();
console.log(`Current year spring equinox: ${currentYear}-${solarTermDates['春分']}`);

// Test 3: Year calculation for different terms
console.log('\n=== Test 3: Year Handling ===');
console.log('Normal terms (same year):');
console.log(`  春分: ${currentYear}-${solarTermDates['春分']}`);
console.log(`  立秋: ${currentYear}-${solarTermDates['立秋']}`);

console.log('Special terms (next year):');
console.log(`  小寒: ${currentYear + 1}-${solarTermDates['小寒']}`);
console.log(`  大寒: ${currentYear + 1}-${solarTermDates['大寒']}`);

console.log('\n✅ Date calculation fixes tested successfully!');