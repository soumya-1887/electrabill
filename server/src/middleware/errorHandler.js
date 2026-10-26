/**
 * Centralized Error Handling Middleware
 */

function errorHandler(err, req, res, next) {
  // Log error in development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.url}:`, err.message);
  }

  // Handle SQLite constraint errors (e.g. UNIQUE constraint failed)
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    if (err.message.includes('meter_number')) {
      return res.status(409).json({
        success: false,
        error: 'A customer with this meter number already exists.'
      });
    }
    if (err.message.includes('bill_number')) {
      return res.status(409).json({
        success: false,
        error: 'A bill with this bill number already exists.'
      });
    }
    return res.status(409).json({
      success: false,
      error: 'Unique constraint violation.'
    });
  }

  // Handle foreign key constraint failure
  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      success: false,
      error: 'Foreign key constraint failed. Related record does not exist or has active links.'
    });
  }

  const statusCode = err.status || (err.name === 'ValidationError' ? 400 : 500);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
