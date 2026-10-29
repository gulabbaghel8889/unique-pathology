import rateLimit from 'express-rate-limit'

const isDev = process.env.NODE_ENV !== 'production'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  limit: isDev ? 10000 : 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again after a few minutes.' },
  skip: (req) => isDev || req.ip === '127.0.0.1' || req.ip === '::1',
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
  skip: (req) => isDev || req.ip === '127.0.0.1' || req.ip === '::1',
})

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 100 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait a short while before requesting again.' },
})

