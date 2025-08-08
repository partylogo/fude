// Events API Handler
const EventRepository = require('../database/eventRepository');
const EventsService = require('../services/eventsService');
const LunarCalendarService = require('../services/lunarCalendarService');

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
      errors.push('type must be one of: deity, festival, custom');
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      errors.push('description is required');
    }
  }

  if (data.lunar_month !== undefined) {
    const month = parseInt(data.lunar_month);
    if (isNaN(month) || month < 1 || month > 12) {
      errors.push('lunar_month must be between 1 and 12');
    }
  }

  if (data.lunar_day !== undefined) {
    const day = parseInt(data.lunar_day);
    if (isNaN(day) || day < 1 || day > 30) {
      errors.push('lunar_day must be between 1 and 30');
    }
  }

  // 建立時：必須提供至少一種日期來源；更新時：若有提供則檢查，未提供則放過
  const hasSolar = data.solar_date !== undefined && data.solar_date !== null && String(data.solar_date).trim() !== '';
  const hasLunar = data.lunar_month !== undefined && data.lunar_day !== undefined;
  const hasSolarParts = data.solar_month !== undefined && data.solar_day !== undefined;
  const hasOneTime = data.one_time_date !== undefined && String(data.one_time_date).trim() !== '';
  if (!isUpdate) {
    if (!hasSolar && !hasLunar && !hasSolarParts && !hasOneTime) {
      errors.push('Provide one of: solar_date, (lunar_month + lunar_day), (solar_month + solar_day), or one_time_date');
    }
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
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }

    // 使用 repository 取得資料
    let events;
    if (from || to) {
      events = await repository.findByDateRange(from, to);
    } else {
      events = await repository.findAll();
    }

    res.status(200).json({
      events: events
    });
  } catch (error) {
    console.error('[eventsHandler] error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'E_EVENTS_LIST' });
  }
};

// GET /api/events/:id - 取得單一事件
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const repository = new EventRepository();

    const event = await repository.findById(parseInt(id));
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('[getEvent] error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'E_EVENT_GET' });
  }
};

// POST /api/events - 建立新事件
const createEvent = async (req, res) => {
  try {
    const repository = new EventRepository();

    // 驗證資料
    const errors = validateEventData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed: ' + errors.join(', ')
      });
    }

    // 若未提供 solar_date，但有 lunar_month/day，嘗試轉為國曆
    if (!req.body.solar_date && req.body.lunar_month && req.body.lunar_day) {
      const converted = LunarCalendarService.convertToSolar({
        month: Number(req.body.lunar_month),
        day: Number(req.body.lunar_day),
        isLeap: Boolean(req.body.is_leap_month)
      });
      if (Array.isArray(converted) && converted.length > 0) {
        // 先取第一個日期即可（DB 層會存陣列）
        req.body.solar_date = converted[0];
      }
    }

    // 若有提供 solar_month/solar_day，組合成 YYYY-MM-DD（用當前年份）
    if (!req.body.solar_date && req.body.solar_month && req.body.solar_day) {
      const now = new Date();
      const y = now.getUTCFullYear();
      const mm = String(Number(req.body.solar_month)).padStart(2, '0');
      const dd = String(Number(req.body.solar_day)).padStart(2, '0');
      req.body.solar_date = `${y}-${mm}-${dd}`;
    }

    // 若提供 one_time_date，直接使用為 solar_date
    if (!req.body.solar_date && req.body.one_time_date) {
      req.body.solar_date = req.body.one_time_date;
    }

    // 建立事件
    const newEvent = await repository.create(req.body);

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('[createEvent] error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'E_EVENT_CREATE' });
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
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // 驗證更新資料
    const errors = validateEventData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed: ' + errors.join(', ')
      });
    }

    // 與建立同樣的日期自動化邏輯（若送來的是分解欄位或農曆或一次性日期）
    if (!req.body.solar_date && req.body.lunar_month && req.body.lunar_day) {
      const converted = LunarCalendarService.convertToSolar({
        month: Number(req.body.lunar_month),
        day: Number(req.body.lunar_day),
        isLeap: Boolean(req.body.is_leap_month)
      });
      if (Array.isArray(converted) && converted.length > 0) {
        req.body.solar_date = converted[0];
      }
    }

    if (!req.body.solar_date && req.body.solar_month && req.body.solar_day) {
      const now = new Date();
      const y = now.getUTCFullYear();
      const mm = String(Number(req.body.solar_month)).padStart(2, '0');
      const dd = String(Number(req.body.solar_day)).padStart(2, '0');
      req.body.solar_date = `${y}-${mm}-${dd}`;
    }

    if (!req.body.solar_date && req.body.one_time_date) {
      req.body.solar_date = req.body.one_time_date;
    }

    // 更新事件
    const updatedEvent = await repository.update(parseInt(id), req.body);

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('[updateEvent] error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'E_EVENT_UPDATE' });
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
      return res.status(404).json({
        error: 'Event not found'
      });
    }

    // 刪除事件
    const success = await repository.delete(parseInt(id));
    if (!success) {
      return res.status(500).json({
        error: 'Failed to delete event'
      });
    }

    res.status(200).json({
      message: 'Event deleted successfully',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('[deleteEvent] error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'E_EVENT_DELETE' });
  }
};

module.exports = {
  eventsHandler,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
};