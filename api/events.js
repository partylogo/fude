// Events API Handler
const mockEvents = require('../data/mockEvents');
const EventsService = require('../services/eventsService');

const eventsHandler = (req, res) => {
  try {
    const { from, to } = req.query;

    // 驗證日期格式
    if (!EventsService.isValidDateString(from) || !EventsService.isValidDateString(to)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }

    // 使用 service 進行日期過濾
    const filteredEvents = EventsService.filterByDateRange(mockEvents, from, to);

    res.status(200).json({
      events: filteredEvents
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = eventsHandler;