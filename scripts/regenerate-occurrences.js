#!/usr/bin/env node
// 重新生成所有事件的 occurrences

const EventRepository = require('../database/eventRepository');
const OccurrenceGenerationService = require('../services/occurrenceGenerationService');

async function regenerateAllOccurrences() {
  console.log('🔄 開始重新生成所有事件的 occurrences...');
  
  try {
    const repository = new EventRepository();
    const occurrenceService = new OccurrenceGenerationService();
    
    // 獲取所有事件
    const events = await repository.findAll();
    console.log(`📋 找到 ${events.length} 個事件`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const event of events) {
      try {
        console.log(`📝 處理事件 ${event.id}: ${event.title} (${event.type})`);
        
        // 清理舊的 occurrences
        await occurrenceService.clearOccurrences(event.id);
        
        // 重新生成 occurrences（只對支援的類型）
        if (['festival', 'custom', 'solar_term'].includes(event.type)) {
          await occurrenceService.generateOccurrences(event, { force: true });
          console.log(`✅ 事件 ${event.id} 生成成功`);
        } else {
          console.log(`⏭️ 事件 ${event.id} (${event.type}) 暫不支援 occurrence 生成`);
        }
        
        successCount++;
      } catch (error) {
        console.error(`❌ 事件 ${event.id} 生成失敗:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 執行結果:');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失敗: ${errorCount}`);
    console.log('🎉 Occurrences 重新生成完成!');
    
  } catch (error) {
    console.error('💥 執行過程中發生錯誤:', error);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  regenerateAllOccurrences();
}

module.exports = { regenerateAllOccurrences };