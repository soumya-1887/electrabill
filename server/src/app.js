const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const errorHandler = require('./middleware/errorHandler');
const customerRoutes = require('./routes/customerRoutes');
const billRoutes = require('./routes/billRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const db = require('./database/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  try {
    const check = db.get('SELECT 1 as healthy');
    res.json({
      status: 'ok',
      service: 'ElectraBill API',
      database: check && check.healthy === 1 ? 'connected' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      service: 'ElectraBill API',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Mount API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);

// Catch-all 404 for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Serve production static frontend if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
