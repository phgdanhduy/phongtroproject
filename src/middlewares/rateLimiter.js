/**
 * Pipes and Filters Pattern: Rate Limiting Middleware
 * Thuộc tính chất lượng: Security & Availability (chống brute-force & DoS spam)
 * Môn: Kiến trúc phần mềm - Giảng viên: Võ Đình Hiếu
 */

function createRateLimiter({
  windowMs = 60 * 1000,
  max = 30,
  message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  errorCode = 'TOO_MANY_REQUESTS',
} = {}) {
  const store = new Map();

  // Dọn dẹp bộ nhớ định kỳ sau mỗi 5 phút
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return function rateLimiterMiddleware(req, res, next) {
    // Nhận diện client qua IP hoặc user ID nếu đã đăng nhập
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const clientKey = req.user?.id ? `user_${req.user.id}` : `ip_${ip}`;

    const now = Date.now();
    let record = store.get(clientKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(clientKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Chuẩn hóa header RateLimit theo IETF draft
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        message,
        error: errorCode,
      });
    }

    next();
  };
}

// 1. Giới hạn đăng nhập: tối đa 10 lần / 1 phút (chống tấn công dò mật khẩu brute-force)
const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ 1 phút trước khi thử lại.',
  errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
});

// 2. Giới hạn ghép phòng & tìm kiếm: tối đa 40 yêu cầu / 1 phút (chống spam lời mời và quét dữ liệu)
const matchingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: 'Hệ thống đang tiếp nhận quá nhiều yêu cầu ghép phòng từ bạn. Vui lòng thử lại sau ít phút.',
  errorCode: 'MATCHING_RATE_LIMIT_EXCEEDED',
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  matchingRateLimiter,
};
