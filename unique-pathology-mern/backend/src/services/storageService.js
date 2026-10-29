import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { config } from '../config/index.js'

// Ensure private reports storage directory exists on startup
if (!fs.existsSync(config.storage.reportsDir)) {
  fs.mkdirSync(config.storage.reportsDir, { recursive: true })
}

/**
 * Saves a buffer or uploaded file to private storage under a random unique key
 */
export async function savePrivateReportFile({ buffer, originalName, mimeType }) {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowedMimes.includes(mimeType)) {
    throw new Error('Unsupported file format. Only PDF, JPG, and PNG reports are allowed.')
  }

  const extension = path.extname(originalName) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg')
  const storageKey = `${crypto.randomUUID()}${extension}`
  const destinationPath = path.join(config.storage.reportsDir, storageKey)

  await fs.promises.writeFile(destinationPath, buffer)

  const hash = crypto.createHash('sha256').update(buffer).digest('hex')

  return {
    storageKey,
    fileSizeBytes: buffer.length,
    checksumSha256: hash,
  }
}

/**
 * Checks if a report file exists in private storage
 */
export function reportFileExists(storageKey) {
  const filePath = path.join(config.storage.reportsDir, path.basename(storageKey))
  return fs.existsSync(filePath)
}

/**
 * Returns read stream for a stored report file
 */
export function getReportStream(storageKey) {
  // Prevent path traversal by using basename
  const safeKey = path.basename(storageKey)
  const filePath = path.join(config.storage.reportsDir, safeKey)

  if (!fs.existsSync(filePath)) {
    throw new Error('Requested report file does not exist on disk.')
  }

  return fs.createReadStream(filePath)
}

/**
 * Deletes a file from private storage
 */
export async function deletePrivateReportFile(storageKey) {
  try {
    const safeKey = path.basename(storageKey)
    const filePath = path.join(config.storage.reportsDir, safeKey)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
    return true
  } catch (err) {
    console.error(`Failed to delete report file ${storageKey}:`, err.message)
    return false
  }
}

/**
 * Generates a short-lived random token for authorized download
 */
export function generateDownloadToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + config.storage.linkExpiryMinutes * 60 * 1000)
  return { token, expiresAt }
}
