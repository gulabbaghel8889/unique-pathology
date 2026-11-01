import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { config } from './config/index.js'
import { apiLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import { publicRouter } from './routes/publicRoutes.js'
import { testRouter } from './routes/testRoutes.js'
import { bookingRouter } from './routes/bookingRoutes.js'
import { paymentRouter } from './routes/paymentRoutes.js'
import { reportRouter } from './routes/reportRoutes.js'
import { enquiryRouter } from './routes/enquiryRoutes.js'
import { adminRouter } from './routes/adminRoutes.js'
import { offerRouter } from './routes/offerRoutes.js'

export const app = express()

// Avoid long buffering delays if DB is connecting or offline
mongoose.set('bufferTimeoutMS', 2000)

// Security headers
app.disable('x-powered-by')
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS configuration allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true)
      if (
        config.frontendUrl.includes(origin) ||
        config.frontendUrl.includes('*') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.vercel.app') ||
        origin === 'https://unique-pathology.vercel.app'
      ) {
        return callback(null, true)
      }
      callback(new Error(`CORS policy does not allow access from origin: ${origin}`))
    },
    credentials: true,
  })
)

// Body parsers
app.use(express.json({ limit: '200kb' }))
app.use(express.urlencoded({ extended: true, limit: '200kb' }))

// Rate limiting for public API
app.use('/api/', apiLimiter)

// Route mounts
app.use('/api', publicRouter)
app.use('/api', testRouter)
app.use('/api', bookingRouter)
app.use('/api', paymentRouter)
app.use('/api', reportRouter)
app.use('/api', enquiryRouter)
app.use('/api', adminRouter)
app.use('/api', offerRouter)

// 404 fallback for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint '${req.originalUrl}' not found.` })
})

// Centralized error handling
app.use(errorHandler)

// Start server if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  try {
    console.log(`Connecting to MongoDB: ${config.mongoUri}`)
    await mongoose.connect(config.mongoUri)
    console.log('MongoDB connected successfully.')

    app.listen(config.port, () => {
      console.log(`Unique Pathology Diagnostic Centre API running on http://localhost:${config.port}`)
      console.log(`Environment: ${config.nodeEnv}`)
      console.log(`Business: ${config.business.name} (${config.business.city}, ${config.business.state})`)
    })
  } catch (err) {
    console.error('Fatal Server Boot Error:', err.message)
    process.exit(1)
  }
}
