const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Import API routes
const { eventsHandler, getEvent, createEvent, updateEvent, deleteEvent } = require('./api/events');
const lunarHandler = require('./api/lunar');
const { groupsHandler, groupDetailHandler, groupItemsHandler } = require('./api/groups');

// Events Routes (CRUD)
app.get('/api/events', eventsHandler);      // 取得事件列表
app.post('/api/events', createEvent);       // 建立新事件
app.get('/api/events/:id', getEvent);       // 取得單一事件
app.put('/api/events/:id', updateEvent);    // 更新事件
app.delete('/api/events/:id', deleteEvent); // 刪除事件

// Other Routes
app.post('/api/lunar', lunarHandler);
app.get('/api/groups', groupsHandler);
app.get('/api/groups/:id', groupDetailHandler);
app.get('/api/groups/:id/items', groupItemsHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;