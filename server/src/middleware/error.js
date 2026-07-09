// Central error handler. Must be registered last.
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) console.error(err);

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'That record already exists' });
  }
  res.status(status).json({ error: err.message || 'Internal server error' });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}
