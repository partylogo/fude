const express = require('express');
const app = express();
const PORT = 3000;

// Import API routes
const eventsHandler = require('./api/events');

// Routes
app.get('/api/events', eventsHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;