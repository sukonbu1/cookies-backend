const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler }; 