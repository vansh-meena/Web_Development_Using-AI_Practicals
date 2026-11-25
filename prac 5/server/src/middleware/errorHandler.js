function apiError(message, details, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'ValidationError') {
    const details = Object.fromEntries(
      Object.entries(error.errors).map(([field, fieldError]) => [field, fieldError.message])
    );
    return res.status(400).json({ error: { message: 'Validation failed', details } });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      error: { message: 'Invalid task id', details: { field: error.path } }
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      error: { message: 'A task with these values already exists', details: error.keyValue || {} }
    });
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    console.error(error);
    return res.status(500).json({
      error: { message: 'An unexpected server error occurred', details: {} }
    });
  }

  return res.status(statusCode).json({
    error: { message: error.message, details: error.details || {} }
  });
}

module.exports = { apiError, errorHandler };
