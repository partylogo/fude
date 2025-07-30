// Events API Handler
const mockEvents = require('../data/mockEvents');

const eventsHandler = (req, res) => {
  try {
    // 回傳事件列表
    res.status(200).json({
      events: mockEvents
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = eventsHandler;