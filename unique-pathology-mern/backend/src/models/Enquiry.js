import mongoose from 'mongoose'

const enquirySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['general', 'doctor', 'corporate', 'camp', 'franchise'],
      default: 'general',
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    organization: { type: String, trim: true, maxlength: 150 },
    city: { type: String, trim: true, default: 'Mandideep / Bhopal Region' },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['new', 'contacted', 'resolved', 'closed'],
      default: 'new',
      index: true,
    },
    adminNotes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
)

export const Enquiry = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema)
