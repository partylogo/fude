// 重新生成 Occurrences API
const EventRepository = require('../database/eventRepository');
const OccurrenceGenerationService = require('../services/occurrenceGenerationService');
const { sendError, sendInternalError } = require('../utils/errorHandler');

async function regenerateHandler(req, res) {
  console.log('[RegenerateAPI] Starting occurrences regeneration...');
  
  try {
    const repository = new EventRepository();
    const occurrenceService = new OccurrenceGenerationService();
    
    // 獲取所有事件
    const events = await repository.findAll();
    console.log(`[RegenerateAPI] Found ${events.length} events`);
    
    const results = {
      total: events.length,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      processed: []
    };
    
    for (const event of events) {
      try {
        console.log(`[RegenerateAPI] Processing event ${event.id}: ${event.title} (${event.type})`);
        
        // 清理舊的 occurrences
        await occurrenceService.clearOccurrences(event.id);
        
        // 重新生成 occurrences（只對支援的類型）
        if (['festival', 'custom', 'solar_term'].includes(event.type)) {
          await occurrenceService.generateOccurrences(event, { force: true });
          console.log(`[RegenerateAPI] Event ${event.id} generated successfully`);
          
          results.success++;
          results.processed.push({
            id: event.id,
            title: event.title,
            type: event.type,
            status: 'success'
          });
        } else {
          console.log(`[RegenerateAPI] Event ${event.id} (${event.type}) skipped - type not supported`);
          
          results.skipped++;
          results.processed.push({
            id: event.id,
            title: event.title,
            type: event.type,
            status: 'skipped',
            reason: 'type_not_supported'
          });
        }
      } catch (error) {
        console.error(`[RegenerateAPI] Event ${event.id} failed:`, error.message);
        
        results.failed++;
        results.errors.push({
          event_id: event.id,
          error: error.message
        });
        results.processed.push({
          id: event.id,
          title: event.title,
          type: event.type,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    console.log('[RegenerateAPI] Regeneration completed:', results);
    
    res.json({
      message: 'Occurrences regeneration completed',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RegenerateAPI] Fatal error:', error);
    return sendInternalError(res, error, 'REGENERATE_ERROR');
  }
}

module.exports = { regenerateHandler };