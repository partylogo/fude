// System API - 複雜日期規則系統管理 API
// Based on admin-date-rule.md design

const express = require('express');
const dateGenerationService = require('../services/dateGenerationService');
const { query } = require('../database/database');

const router = express.Router();

/**
 * GET /api/system/extension-status - 取得系統延伸狀態
 */
router.get('/extension-status', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        min_extended_year: null,
        max_extended_year: null,
        total_events: 0,
        events_need_extension: 0,
        target_extension_year: new Date().getFullYear() + 5
      });
    }
    const result = await query('SELECT * FROM system_extension_status');
    res.json(result.rows[0] || {
      min_extended_year: null,
      max_extended_year: null,
      total_events: 0,
      events_need_extension: 0,
      target_extension_year: new Date().getFullYear() + 5
    });
  } catch (error) {
    console.error('Error fetching extension status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/system/maintenance-history - 取得維護歷史記錄
 */
router.get('/maintenance-history', async (req, res) => {
  try {
    // 開發環境或表不存在時返回模擬資料
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        records: [
          {
            id: 1,
            maintenance_type: 'annual_extension',
            target_year: new Date().getFullYear() + 1,
            events_processed: 0,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            status: 'completed'
          }
        ],
        total: 1
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const result = await query(`
      SELECT * FROM system_maintenance 
      ORDER BY started_at DESC 
      LIMIT $1
    `, [limit]);
    
    res.json({ 
      records: result.rows,
      total: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    // 回退到模擬資料
    res.json({ 
      records: [],
      total: 0 
    });
  }
});

/**
 * POST /api/system/trigger-maintenance - 手動觸發年度維護
 */
router.post('/trigger-maintenance', async (req, res) => {
  try {
    // 開發環境簡易響應，避免連線真實資料庫
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        message: '開發模式：模擬維護完成',
        success: true,
        events_processed: 0,
        occurrences_created: 0,
        occurrences_deleted: 0,
        solar_terms_processed: 0
      });
    }

    const result = await dateGenerationService.annualMaintenanceJob();
    res.json({ 
      message: '維護完成', 
      success: true,
      ...result 
    });
  } catch (error) {
    console.error('Error triggering maintenance:', error);
    res.status(500).json({ 
      error: '維護失敗', 
      message: error.message,
      success: false
    });
  }
});

/**
 * POST /api/system/generate-occurrences - 手動觸發事件日期生成
 */
router.post('/generate-occurrences', async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ 
        error: 'Missing eventId parameter' 
      });
    }

    const count = await dateGenerationService.generateOccurrences(eventId);
    
    res.json({ 
      message: '日期生成完成',
      eventId,
      generated_count: count,
      success: true
    });
  } catch (error) {
    console.error('Error generating occurrences:', error);
    res.status(500).json({ 
      error: '日期生成失敗', 
      message: error.message,
      success: false
    });
  }
});

/**
 * GET /api/system/generation-errors - 查詢生成錯誤記錄
 */
router.get('/generation-errors', async (req, res) => {
  try {
    // 開發環境返回空錯誤列表
    if (process.env.NODE_ENV === 'development') {
      return res.json({ 
        errors: [],
        total: 0 
      });
    }

    const limit = parseInt(req.query.limit) || 50;
    const eventId = req.query.eventId;
    const unresolved = req.query.unresolved === 'true';
    
    let queryStr = `
      SELECT ge.*, e.title as event_title 
      FROM generation_errors ge
      LEFT JOIN events e ON ge.event_id = e.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (eventId) {
      queryStr += ` AND ge.event_id = $${paramIndex}`;
      params.push(eventId);
      paramIndex++;
    }
    
    if (unresolved) {
      queryStr += ` AND ge.resolved_at IS NULL`;
    }
    
    queryStr += ` ORDER BY ge.occurred_at DESC LIMIT $${paramIndex}`;
    params.push(limit);
    
    const result = await query(queryStr, params);
    
    res.json({ 
      errors: result.rows,
      total: result.rows.length 
    });
  } catch (error) {
    console.error('Error fetching generation errors:', error);
    // 回退到空列表
    res.json({ 
      errors: [],
      total: 0 
    });
  }
});

/**
 * PUT /api/system/generation-errors/:id/resolve - 標記錯誤為已解決
 */
router.put('/generation-errors/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    
    await query(`
      UPDATE generation_errors 
      SET resolved_at = NOW()
      WHERE id = $1
    `, [id]);
    
    res.json({ 
      message: '錯誤已標記為解決',
      success: true
    });
  } catch (error) {
    console.error('Error resolving generation error:', error);
    res.status(500).json({ 
      error: '標記錯誤失敗', 
      message: error.message,
      success: false
    });
  }
});

/**
 * GET /api/solar-terms/:year - 查詢指定年份24節氣日期
 */
router.get('/solar-terms/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const yearInt = parseInt(year);
    
    if (isNaN(yearInt) || yearInt < 1900 || yearInt > 2100) {
      return res.status(400).json({ 
        error: 'Invalid year parameter (must be between 1900-2100)' 
      });
    }
    
    // 確保節氣資料存在
    await dateGenerationService.ensureSolarTermsData(yearInt);
    
    const result = await query(`
      SELECT st.term_name, st.occurrence_date, stt.display_order, stt.season
      FROM solar_terms st
      JOIN solar_term_types stt ON st.term_name = stt.name
      WHERE st.year = $1
      ORDER BY stt.display_order
    `, [yearInt]);
    
    res.json({ 
      year: yearInt,
      solar_terms: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching solar terms:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/system/daily-cron - 手動觸發每日排程
 * (實際生產環境會由 Vercel Cron 自動調用)
 */
router.post('/daily-cron', async (req, res) => {
  try {
    const result = await dateGenerationService.dailyOccurrenceGeneration();
    res.json({ 
      message: '每日排程完成',
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error running daily cron:', error);
    res.status(500).json({ 
      error: '每日排程失敗', 
      message: error.message,
      success: false
    });
  }
});

module.exports = router;