import { ZodError } from 'zod'
import { config } from '../config/index.js'

export function errorHandler(err, req, res, _next) {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed. Please verify the submitted data.',
      errors: err.flatten().fieldErrors,
    })
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'record'
    return res.status(409).json({
      message: `A record with this ${field} already exists.`,
    })
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum allowed size is 10 MB.' })
    }
    return res.status(400).json({ message: `File upload error: ${err.message}` })
  }

  // Safe logging in dev / prod
  console.error('[API Error]', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    ...(config.isProd ? {} : { stack: err.stack }),
  })

  const status = Number.isInteger(err.status) ? err.status : 500
  const userMessage =
    status < 500
      ? err.message
      : 'An unexpected internal error occurred. Please contact the centre if this persists.'

  res.status(status).json({
    message: userMessage,
    ...(config.isProd ? {} : { debug: err.message }),
  })
}
