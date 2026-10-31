import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { Doctor } from '../models/Doctor.js'

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || (req.query.token ? `Bearer ${req.query.token}` : null)
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication token required.' })
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return res.status(401).json({ message: 'Bearer token is missing.' })
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret)
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Administrator privileges required.' })
    }

    req.admin = {
      email: payload.email,
      role: payload.role,
    }

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
    }
    return res.status(401).json({ message: 'Invalid authentication session.' })
  }
}

export async function requireDoctor(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: 'Doctor authentication token required.' })
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return res.status(401).json({ message: 'Bearer token is missing.' })
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret)
    if (payload.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied: Doctor privileges required.' })
    }

    const doctor = await Doctor.findById(payload.id).lean()
    if (!doctor) {
      return res.status(401).json({ message: 'Doctor profile not found.' })
    }

    if (doctor.status !== 'active') {
      return res.status(403).json({
        message: 'Your doctor account is currently deactivated. Please contact laboratory management.',
      })
    }

    req.doctor = {
      id: String(doctor._id),
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      mobile: doctor.mobile,
      discountPercent: doctor.discountPercent,
      commissionPercent: doctor.commissionPercent || 0,
      specialization: doctor.specialization,
      clinicName: doctor.clinicName,
      referralCode: doctor.referralCode,
      role: 'doctor',
    }

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your doctor session has expired. Please log in again.' })
    }
    return res.status(401).json({ message: 'Invalid doctor authentication session.' })
  }
}
