function errorHandler(err, req, res, next) {
  console.error('[Error Details]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Đã có lỗi xảy ra trên máy chủ';
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    error: errorCode
  });
}

module.exports = errorHandler;
