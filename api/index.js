// Vercel Serverless Entry
const express = require('express');
const app = express();

app.use(express.json());

// Import route handlers
const { eventsHandler, getEvent, createEvent, updateEvent, deleteEvent } = require('./events');
const lunarHandler = require('./lunar');
const { 
  groupsHandler, 
  groupDetailHandler, 
  groupItemsHandler,
  createGroup,
  updateGroup,
  deleteGroup,
  addGroupItem,
  removeGroupItem
} = require('./groups');

// System router (optional in this codebase; if not present, ignore)
let systemRouter = null;
try {
  systemRouter = require('./system');
} catch (_e) {}

// Routes
app.get('/api/events', eventsHandler);
app.post('/api/events', createEvent);
app.get('/api/events/:id', getEvent);
app.put('/api/events/:id', updateEvent);
app.delete('/api/events/:id', deleteEvent);

app.get('/api/groups', groupsHandler);
app.post('/api/groups', createGroup);
app.get('/api/groups/:id', groupDetailHandler);
app.put('/api/groups/:id', updateGroup);
app.delete('/api/groups/:id', deleteGroup);
app.get('/api/groups/:id/items', groupItemsHandler);
app.post('/api/groups/:id/items', addGroupItem);
app.delete('/api/groups/:id/items/:eventId', removeGroupItem);

app.post('/api/lunar', lunarHandler);

if (systemRouter) {
  app.use('/api/system', systemRouter);
  app.use('/api', systemRouter);
}

module.exports = app;

