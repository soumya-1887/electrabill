require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./database/db');

const PORT = process.env.PORT || 5000;

try {
  // Ensure database tables exist before server listens
  initDatabase();
  console.log('✅ SQLite database schema initialized successfully.');

  app.listen(PORT, () => {
    console.log(`⚡ ElectraBill Server running on http://localhost:${PORT}`);
    console.log(`🔌 Health check available at http://localhost:${PORT}/api/health`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
