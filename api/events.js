// Events API Handler
const EventRepository = require('../database/eventRepository');
const EventsService = require('../services/eventsService');

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
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = eventsHandler;