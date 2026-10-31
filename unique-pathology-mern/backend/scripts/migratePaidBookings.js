import 'dotenv/config'
import mongoose from 'mongoose'
import { config } from '../src/config/index.js'
import { syncPaidBookingsMigration } from '../src/services/paymentMigrationService.js'

async function run() {
  console.log('--- STARTING PAID BOOKINGS PAYMENT MIGRATION ---')
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB Atlas.')

  const result = await syncPaidBookingsMigration()
  console.log('Migration Result:', JSON.stringify(result, null, 2))

  await mongoose.disconnect()
  console.log('--- MIGRATION COMPLETE ---')
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
