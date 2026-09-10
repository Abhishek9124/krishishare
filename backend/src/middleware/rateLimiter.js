const rateLimit = require('express-rate-limit');

// Disable rate limiter validation errors on proxy serverless platforms (Vercel)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
  skip: () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production',
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
  skip: () => process.env.VERCEL === '1' || process.env.NODE_ENV === 'production',
});

module.exports = { authRateLimiter, apiRateLimiter };
