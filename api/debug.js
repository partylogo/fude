// 診斷 API - 檢查系統狀態
const getSupabaseClient = require('../database/supabaseClient');
const { sendError, sendInternalError } = require('../utils/errorHandler');

async function debugHandler(req, res) {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        ENFORCE_DB_WRITES: process.env.ENFORCE_DB_WRITES,
        READ_FALLBACK: process.env.READ_FALLBACK,
        SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
      },
      database: {
        supabase_client: null,
        connection_test: null,
        events_table: null,
        event_occurrences_table: null
      }
    };

    // 測試 Supabase 連接
    try {
      const supabase = getSupabaseClient();
      diagnostics.database.supabase_client = supabase ? 'OK' : 'NULL';
      
      if (supabase) {
        // 測試連接
        const { data, error } = await supabase.from('events').select('count').limit(1);
        diagnostics.database.connection_test = error ? `ERROR: ${error.message}` : 'OK';
        
        // 測試 events 表
        const { data: eventsData, error: eventsError } = await supabase.from('events').select('*').limit(1);
        diagnostics.database.events_table = eventsError ? `ERROR: ${eventsError.message}` : 'OK';
        
        // 測試 event_occurrences 表
        const { data: occData, error: occError } = await supabase.from('event_occurrences').select('*').limit(1);
        diagnostics.database.event_occurrences_table = occError ? `ERROR: ${occError.message}` : 'OK';
      }
    } catch (dbError) {
      diagnostics.database.connection_test = `EXCEPTION: ${dbError.message}`;
    }

    // 測試服務可用性
    try {
      const OccurrenceGenerationService = require('../services/occurrenceGenerationService');
      const service = new OccurrenceGenerationService();
      diagnostics.services = {
        occurrence_service: 'OK',
        supabase_in_service: service.supabase ? 'OK' : 'NULL'
      };
    } catch (serviceError) {
      diagnostics.services = {
        occurrence_service: `ERROR: ${serviceError.message}`
      };
    }

    res.json(diagnostics);
  } catch (error) {
    return sendInternalError(res, error, 'DIAGNOSTIC_ERROR');
  }
}

module.exports = { debugHandler };