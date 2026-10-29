import express from 'express'
import { z } from 'zod'
import { Enquiry } from '../models/Enquiry.js'
import { recordAudit } from '../services/auditService.js'

export const enquiryRouter = express.Router()

const enquiryInputSchema = z.object({
  type: z.enum(['general', 'doctor', 'corporate', 'camp', 'franchise']).default('general'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Please enter a valid email address').max(254),
  phone: z.string().regex(/^[0-9]{10}$/, 'Please enter a 10-digit mobile number'),
  organization: z.string().trim().max(150).optional(),
  city: z.string().trim().max(100).default('Mandideep / Bhopal Region'),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000),
})

// POST /api/enquiries - Submit Doctor, Corporate, Health Camp or General enquiry
enquiryRouter.post('/enquiries', async (req, res, next) => {
  try {
    const parsed = enquiryInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Please check your enquiry form inputs.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const enquiry = await Enquiry.create(parsed.data)

    await recordAudit({
      action: 'enquiry_submitted',
      category: 'system',
      performedBy: 'visitor',
      targetId: String(enquiry._id),
      details: { type: enquiry.type, organization: enquiry.organization },
      req,
    })

    const confirmationMessages = {
      doctor: 'Thank you, Doctor. Our diagnostic liaison team will connect with your clinic promptly.',
      corporate: 'Thank you for your corporate screening enquiry. Our wellness coordinator will share custom packages.',
      camp: 'Thank you. Our community screening team in Mandideep will review your health camp request.',
      franchise: 'Thank you for your interest in partnering with Unique Pathology. We will be in touch shortly.',
      general: 'Thank you for contacting Unique Pathology. Our team will review your message and reply soon.',
    }

    res.status(201).json({
      message: confirmationMessages[enquiry.type] || confirmationMessages.general,
      enquiryId: enquiry._id,
    })
  } catch (err) {
    next(err)
  }
})
