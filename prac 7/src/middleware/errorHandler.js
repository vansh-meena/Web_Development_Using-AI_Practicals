function isObjectIdCastError(err) {
  return err.name === 'CastError' && err.kind === 'ObjectId';
}

function buildValidationDetails(err) {
  return Object.values(err.errors || {}).map((e) => ({
    field: e.path,
    message: e.message,
  }));
}

function sendError(res, status, code, message, details) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return sendError(res, 400, 'BAD_JSON', 'Malformed JSON body', [
      { field: 'body', message: err.message },
    ]);
  }

  if (err.type === 'entity.too.large') {
    return sendError(res, 400, 'BAD_REQUEST', 'Request body too large');
  }

  if (isObjectIdCastError(err)) {
    return sendError(res, 400, 'INVALID_ID', 'Invalid id format');
  }

  if (err.name === 'ValidationError') {
    return sendError(
      res,
      400,
      'VALIDATION_ERROR',
      'Validation failed',
      buildValidationDetails(err)
    );
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || { field: 'name' })[0];
    return sendError(res, 409, 'DUPLICATE_KEY', `A product with this ${field} already exists`, [
      { field, message: `must be unique` },
    ]);
  }

  console.error('[error]', err);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Something went wrong');
}

module.exports = { errorHandler, notFound };
