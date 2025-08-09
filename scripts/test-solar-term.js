#!/usr/bin/env node
// 測試 solar_term 事件創建

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testSolarTermEvent() {
  console.log('🧪 測試 solar_term 事件創建...');
  
  const solarTermData = {
    title: '冬至節氣測試',
    type: 'solar_term',
    description: '測試節氣事件創建',
    solar_term_name: '冬至'
  };

  try {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-version': 'v2'
      },
      body: JSON.stringify(solarTermData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ 創建失敗:', result);
      return;
    }

    console.log('✅ 創建成功:');
    console.log('  ID:', result.id);
    console.log('  標題:', result.title);
    console.log('  類型:', result.type);
    console.log('  節氣:', result.solar_term_name);
    console.log('  下次發生:', result.next_occurrence_date);
    console.log('  規則欄位:', result.rule_fields);

    // 測試獲取事件
    const getResponse = await fetch(`${API_URL}/events/${result.id}`, {
      headers: { 'api-version': 'v2' }
    });
    
    if (getResponse.ok) {
      const getResult = await getResponse.json();
      console.log('✅ 獲取成功 - 下次發生日期:', getResult.next_occurrence_date);
    } else {
      console.error('❌ 獲取失敗');
    }

    // 清理測試資料
    const deleteResponse = await fetch(`${API_URL}/events/${result.id}`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      console.log('🧹 測試資料已清理');
    }

  } catch (error) {
    console.error('❌ 測試錯誤:', error.message);
  }
}

testSolarTermEvent();