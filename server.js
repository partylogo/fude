const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Import API routes
const { eventsHandler, getEvent, createEvent, updateEvent, deleteEvent } = require('./api/events');
const lunarHandler = require('./api/lunar');
const { 
  groupsHandler, 
  groupDetailHandler, 
  groupItemsHandler,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupItem,
  removeGroupItem
} = require('./api/groups');
const systemRouter = require('./api/system');

// Events Routes (CRUD)
app.get('/api/events', eventsHandler);      // 取得事件列表
app.post('/api/events', createEvent);       // 建立新事件
app.get('/api/events/:id', getEvent);       // 取得單一事件
app.put('/api/events/:id', updateEvent);    // 更新事件
app.delete('/api/events/:id', deleteEvent); // 刪除事件

// Groups Routes (CRUD)
app.get('/api/groups', groupsHandler);                        // 取得群組列表
app.post('/api/groups', createGroup);                         // 建立新群組
app.get('/api/groups/:id', groupDetailHandler);               // 取得單一群組
app.put('/api/groups/:id', updateGroup);                      // 更新群組
app.delete('/api/groups/:id', deleteGroup);                   // 刪除群組
app.get('/api/groups/:id/items', groupItemsHandler);          // 取得群組事件
app.post('/api/groups/:id/items', addGroupItem);              // 添加事件到群組
app.delete('/api/groups/:id/items/:eventId', removeGroupItem); // 從群組移除事件

// System Routes - 複雜日期規則系統 API
app.use('/api/system', systemRouter);
app.use('/api', systemRouter); // 為了向後相容，也直接掛載 solar-terms 路由

// Other Routes
app.post('/api/lunar', lunarHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;