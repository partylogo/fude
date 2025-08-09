// Events API Handler
const EventRepository = require('../database/eventRepository');
const EventsService = require('../services/eventsService');
const LunarCalendarService = require('../services/lunarCalendarService');
const OccurrenceGenerationService = require('../services/occurrenceGenerationService');
const { sendError, sendValidationError, sendSupabaseError, sendInternalError } = require('../utils/errorHandler');

// Phase 2: Occurrence 生成服務實例
const occurrenceService = new OccurrenceGenerationService();

/**
 * Phase 2: 增強事件輸出格式
 * 支援 v1 相容和 v2 新格式
 * @param {Object} event - 原始事件物件
 * @param {Object} options - 輸出選項 {version: 'v1'|'v2', includeNext: boolean}
 * @returns {Promise<Object>} 格式化的事件物件
 */
async function enhanceEventOutput(event, options = {}) {
  const { version = 'v1', includeNext = true } = options;
  const enhanced = { ...event };

  try {
    // v1 相容輸出：維持 solar_date 為字串（首筆）
    if (version === 'v1') {
      if (Array.isArray(enhanced.solar_date)) {
        enhanced.solar_date = enhanced.solar_date[0] || null;
      }
    }

    // v2 輸出：加入 next_occurrence_date
    if (version === 'v2' && includeNext) {
      const nextOccurrence = await occurrenceService.getNextOccurrence(event.id);
      enhanced.next_occurrence_date = nextOccurrence ? nextOccurrence.occurrence_date : null;
      enhanced.next_occurrence_is_leap = nextOccurrence ? nextOccurrence.is_leap_month : null;
      
      // v2 也保留規則欄位供前端使用
      enhanced.rule_fields = {
        is_lunar: enhanced.is_lunar,
        lunar_month: enhanced.lunar_month,
        lunar_day: enhanced.lunar_day,
        is_leap_month: enhanced.is_leap_month,
        leap_behavior: enhanced.leap_behavior,
        solar_month: enhanced.solar_month,
        solar_day: enhanced.solar_day,
        one_time_date: enhanced.one_time_date,
        solar_term_name: enhanced.solar_term_name
      };
    }
  } catch (error) {
    console.error('[enhanceEventOutput] Error enhancing event output:', error);
    // 失敗時返回原始事件，不影響主要功能
  }

  return enhanced;
}

// 驗證事件資料
const validateEventData = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      errors.push('title is required');
    }
  }

  if (!isUpdate || data.type !== undefined) {
    const validTypes = ['deity', 'festival', 'custom', 'solar_term'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push('type must be one of: deity, festival, custom, solar_term');
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      errors.push('description is required');
    }
  }

  if (data.lunar_month !== undefined && data.lunar_month !== null && String(data.lunar_month) !== '') {
    const month = parseInt(data.lunar_month);
    if (isNaN(month) || month < 1 || month > 12) {
      errors.push('lunar_month must be between 1 and 12');
    }
  }

  if (data.lunar_day !== undefined && data.lunar_day !== null && String(data.lunar_day) !== '') {
    const day = parseInt(data.lunar_day);
    if (isNaN(day) || day < 1 || day > 30) {
      errors.push('lunar_day must be between 1 and 30');
    }
  }

  // 建立時：必須提供至少一種日期來源；更新時：若有提供則檢查，未提供則放過
  const hasSolar = data.solar_date !== undefined && data.solar_date !== null && String(data.solar_date).trim() !== '';
  const hasLunar = data.lunar_month !== undefined && data.lunar_day !== undefined && String(data.lunar_month) !== '' && String(data.lunar_day) !== '';
  const hasSolarParts = data.solar_month !== undefined && data.solar_day !== undefined && String(data.solar_month) !== '' && String(data.solar_day) !== '';
  const hasOneTime = data.one_time_date !== undefined && data.one_time_date !== null && String(data.one_time_date).trim() !== '';
  const isSolarTerm = data.type === 'solar_term';
  const hasSolarTerm = data.solar_term_name !== undefined && String(data.solar_term_name).trim() !== '';
  if (!isUpdate) {
    if (isSolarTerm) {
      if (!hasSolarTerm) {
        errors.push('solar_term_name is required for type=solar_term');
      }
    } else if (!hasSolar && !hasLunar && !hasSolarParts && !hasOneTime) {
      errors.push('Provide one of: solar_date, (lunar_month + lunar_day), (solar_month + solar_day), or one_time_date');
    }
  }

  // 若送來 solar_term_name 但為空字串
  if (data.solar_term_name !== undefined && String(data.solar_term_name).trim() === '') {
    errors.push('solar_term_name cannot be empty');
  }

  return errors;
};

// GET /api/events - 取得事件列表
const eventsHandler = async (req, res) => {
  try {
    const { from, to } = req.query;
    const repository = new EventRepository();

    // 驗證日期格式
    if (!EventsService.isValidDateString(from) || !EventsService.isValidDateString(to)) {
      return sendValidationError(res, ['Invalid date format. Use YYYY-MM-DD format.'], 'INVALID_DATE_FORMAT');
    }

    // 使用 repository 取得資料
    let events;
    if (from || to) {
      events = await repository.findByDateRange(from, to);
    } else {
      events = await repository.findAll();
    }

    // Phase 2: 根據 API 版本返回增強輸出
    const apiVersion = req.headers['api-version'] || 'v1';
    const enhancedEvents = [];
    
    for (const event of (events || [])) {
      const enhanced = await enhanceEventOutput(event, { 
        version: apiVersion,
        includeNext: false // 列表不包含 next_occurrence，避免過多查詢
      });
      enhancedEvents.push(enhanced);
    }
    
    // 標註資料來源（debug）：supabase 或 memory
    res.set('X-Data-Source', repository && repository.supabase ? 'supabase' : 'memory');
    res.status(200).json({ events: enhancedEvents });
  } catch (error) {
    return sendInternalError(res, error, 'E_EVENTS_LIST');
  }
};

// GET /api/events/:id - 取得單一事件
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const repository = new EventRepository();

    const event = await repository.findById(parseInt(id));
    if (!event) {
      return sendError(res, 404, 'Event not found', null, 'EVENT_NOT_FOUND');
    }

    // Phase 2: 根據 API 版本返回增強輸出
    const apiVersion = req.headers['api-version'] || 'v1';
    const enhancedEvent = await enhanceEventOutput(event, { version: apiVersion });
    
    res.set('X-Data-Source', repository && repository.supabase ? 'supabase' : 'memory');
    res.status(200).json(enhancedEvent);
  } catch (error) {
    return sendInternalError(res, error, 'E_EVENT_GET');
  }
};

// POST /api/events - 建立新事件
const createEvent = async (req, res) => {
  try {
    const repository = new EventRepository();

    // 驗證資料
    const errors = validateEventData(req.body);
    if (errors.length > 0) {
      return sendValidationError(res, errors, 'E_EVENT_VALIDATION');
    }

    // 只要帶了規則欄位，就以規則覆寫衍生日期（忽略外部傳入的 solar_date）
    // 1) lunar_month/day → 暫不自動轉換（mock 轉換易造成誤導）；保留為空
    // 後續以 event_occurrences 產出的實際國曆日期為主

    // 2) solar_month/solar_day → 用當前年份組 YYYY-MM-DD
    if (req.body.solar_month && req.body.solar_day) {
      const now = new Date();
      const y = now.getUTCFullYear();
      const mm = String(Number(req.body.solar_month)).padStart(2, '0');
      const dd = String(Number(req.body.solar_day)).padStart(2, '0');
      req.body.solar_date = `${y}-${mm}-${dd}`;
    }

    // 3) one_time_date → 直接使用為 solar_date
    if (req.body.one_time_date) {
      req.body.solar_date = req.body.one_time_date;
    }

    // 4) solar_term 事件 → 使用今年的節氣日期作為 solar_date（相容性）
    if (req.body.type === 'solar_term' && req.body.solar_term_name) {
      const solarTermDates = {
        '立春': '02-04', '雨水': '02-19', '驚蟄': '03-06', '春分': '03-21',
        '清明': '04-05', '穀雨': '04-20', '立夏': '05-06', '小滿': '05-21',
        '芒種': '06-06', '夏至': '06-21', '小暑': '07-07', '大暑': '07-23',
        '立秋': '08-08', '處暑': '08-23', '白露': '09-08', '秋分': '09-23',
        '寒露': '10-08', '霜降': '10-23', '立冬': '11-07', '小雪': '11-22',
        '大雪': '12-07', '冬至': '12-22', '小寒': '01-06', '大寒': '01-20'
      };
      
      const termDate = solarTermDates[req.body.solar_term_name];
      if (termDate) {
        const currentYear = new Date().getFullYear();
        req.body.solar_date = `${currentYear}-${termDate}`;
      }
    }

    // 建立事件
    let newEvent;
    try {
      newEvent = await repository.create(req.body);
    } catch (err) {
      // Phase 1: 處理白名單錯誤
      if (err.code === 'INVALID_FIELDS') {
        return sendValidationError(res, [err.message], 'E_INVALID_FIELDS');
      }
      throw err; // 重新拋出其他錯誤
    }

    // Phase 2: 自動生成 occurrences（支援的類型）
    if (['festival', 'custom', 'solar_term'].includes(newEvent.type)) {
      try {
        console.log(`[createEvent] Generating occurrences for ${newEvent.type} event ${newEvent.id}`);
        await occurrenceService.generateOccurrences(newEvent);
      } catch (occError) {
        console.error(`[createEvent] Failed to generate occurrences:`, occError);
        // 不影響事件創建，只記錄錯誤
      }
    }

    // Phase 2: 根據 API 版本返回增強輸出
    const apiVersion = req.headers['api-version'] || 'v1';
    const enhancedEvent = await enhanceEventOutput(newEvent, { version: apiVersion });
    
    res.set('X-Data-Source', repository && repository.supabase ? 'supabase' : 'memory');
    res.status(201).json(enhancedEvent);
  } catch (error) {
    return sendInternalError(res, error, 'E_EVENT_CREATE');
  }
};

// PUT /api/events/:id - 更新事件
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const repository = new EventRepository();

    // 檢查事件是否存在
    const existingEvent = await repository.findById(parseInt(id));
    if (!existingEvent) {
      return sendError(res, 404, 'Event not found', null, 'EVENT_NOT_FOUND');
    }

    // 驗證更新資料
    const errors = validateEventData(req.body, true);
    if (errors.length > 0) {
      return sendValidationError(res, errors, 'E_EVENT_UPDATE_VALIDATION');
    }

    // 與建立同樣的日期自動化邏輯（若送來的是分解欄位或農曆或一次性日期）
    // 1) lunar_month/day → 暫不自動轉換（mock 轉換易造成誤導）；保留為空

    if (req.body.solar_month && req.body.solar_day) {
      const now = new Date();
      const y = now.getUTCFullYear();
      const mm = String(Number(req.body.solar_month)).padStart(2, '0');
      const dd = String(Number(req.body.solar_day)).padStart(2, '0');
      req.body.solar_date = `${y}-${mm}-${dd}`;
    }

    if (req.body.one_time_date) {
      req.body.solar_date = req.body.one_time_date;
    }

    // solar_term 事件邏輯（同創建）
    if (req.body.type === 'solar_term' && req.body.solar_term_name) {
      const solarTermDates = {
        '立春': '02-04', '雨水': '02-19', '驚蟄': '03-06', '春分': '03-21',
        '清明': '04-05', '穀雨': '04-20', '立夏': '05-06', '小滿': '05-21',
        '芒種': '06-06', '夏至': '06-21', '小暑': '07-07', '大暑': '07-23',
        '立秋': '08-08', '處暑': '08-23', '白露': '09-08', '秋分': '09-23',
        '寒露': '10-08', '霜降': '10-23', '立冬': '11-07', '小雪': '11-22',
        '大雪': '12-07', '冬至': '12-22', '小寒': '01-06', '大寒': '01-20'
      };
      
      const termDate = solarTermDates[req.body.solar_term_name];
      if (termDate) {
        const currentYear = new Date().getFullYear();
        req.body.solar_date = `${currentYear}-${termDate}`;
      }
    }

    // 更新事件
    let updatedEvent;
    try {
      updatedEvent = await repository.update(parseInt(id), req.body);
    } catch (err) {
      // Phase 1: 處理白名單錯誤
      if (err.code === 'INVALID_FIELDS') {
        return sendValidationError(res, [err.message], 'E_INVALID_FIELDS');
      }
      throw err; // 重新拋出其他錯誤
    }

    // Phase 2: 重新生成 occurrences（如果規則欄位有變化）
    const ruleFields = ['solar_month', 'solar_day', 'one_time_date', 'lunar_month', 'lunar_day', 'leap_behavior', 'solar_term_name'];
    const hasRuleChanges = ruleFields.some(field => req.body[field] !== undefined);
    
    if (['festival', 'custom', 'solar_term'].includes(updatedEvent.type) && hasRuleChanges) {
      try {
        console.log(`[updateEvent] Regenerating occurrences for updated ${updatedEvent.type} event ${updatedEvent.id}`);
        // 強制重新生成
        await occurrenceService.generateOccurrences(updatedEvent, { force: true });
      } catch (occError) {
        console.error(`[updateEvent] Failed to regenerate occurrences:`, occError);
        // 不影響事件更新，只記錄錯誤
      }
    }

    // Phase 2: 根據 API 版本返回增強輸出
    const apiVersion = req.headers['api-version'] || 'v1';
    const enhancedEvent = await enhanceEventOutput(updatedEvent, { version: apiVersion });
    
    res.set('X-Data-Source', repository && repository.supabase ? 'supabase' : 'memory');
    res.status(200).json(enhancedEvent);
  } catch (error) {
    return sendInternalError(res, error, 'E_EVENT_UPDATE');
  }
};

// DELETE /api/events/:id - 刪除事件
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const repository = new EventRepository();

    // 檢查事件是否存在
    const existingEvent = await repository.findById(parseInt(id));
    if (!existingEvent) {
      return sendError(res, 404, 'Event not found', null, 'EVENT_NOT_FOUND');
    }

    // 刪除事件
    const success = await repository.delete(parseInt(id));
    if (!success) {
      return sendError(res, 500, 'Failed to delete event', null, 'E_EVENT_DELETE_FAILED');
    }

    // Phase 2: 清理相關的 occurrences
    try {
      await occurrenceService.clearOccurrences(parseInt(id));
    } catch (occError) {
      console.error(`[deleteEvent] Failed to clear occurrences for event ${id}:`, occError);
      // 不影響事件刪除，只記錄錯誤
    }

    res.set('X-Data-Source', repository && repository.supabase ? 'supabase' : 'memory');
    res.status(200).json({
      message: 'Event deleted successfully',
      id: parseInt(id)
    });
  } catch (error) {
    return sendInternalError(res, error, 'E_EVENT_DELETE');
  }
};

module.exports = {
  eventsHandler,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
};