class AppError extends Error {
  constructor(message, statusCode = 400, errorCode = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  AppError
};
