const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests from this IP, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authRateLimiter, apiRateLimiter };
