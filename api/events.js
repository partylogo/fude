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

  // 必須提供 solar_date 或者 (lunar_month + lunar_day)
  const hasSolar = data.solar_date !== undefined && data.solar_date !== null && String(data.solar_date).trim() !== '';
  const hasLunar = data.lunar_month !== undefined && data.lunar_day !== undefined;
  if (!hasSolar && !hasLunar) {
    errors.push('Either solar_date (YYYY-MM-DD) or lunar_month + lunar_day is required');
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