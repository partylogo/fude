const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Import API routes
const eventsHandler = require('./api/events');
const lunarHandler = require('./api/lunar');
const { groupsHandler, groupDetailHandler, groupItemsHandler } = require('./api/groups');

// Routes
app.get('/api/events', eventsHandler);
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