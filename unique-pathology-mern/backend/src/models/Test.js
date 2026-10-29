import mongoose from 'mongoose'

const testSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 150 },
    shortCode: { type: String, trim: true, maxlength: 30 },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Blood Tests',
        'Diabetes',
        'Hormones',
        'Heart Health',
        'Organ Health',
        'Infection & Immunity',
        'Vitamins & Nutrition',
        'General Health',
      ],
      default: 'General Health',
    },
    department: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Hematology',
        'Clinical Biochemistry',
        'Immunology & Serology',
        'Clinical Pathology',
        'Endocrinology',
        'Microbiology',
      ],
      default: 'Clinical Biochemistry',
    },
    description: { type: String, trim: true, maxlength: 1000 },
    clinicalRelevance: { type: String, trim: true, maxlength: 1000 },
    sampleType: { type: String, trim: true, default: 'Venous Blood' },
    fastingRequired: { type: Boolean, default: false },
    fastingDuration: { type: String, trim: true, default: 'No special fasting required unless specified by doctor' },
    turnaroundHours: { type: Number, default: 12, min: 1 },
    pricePaise: { type: Number, required: true, min: 0 },
    mrpPaise: { type: Number, default: 0 },
    isVerifiedPrice: { type: Boolean, default: false },
    priceNote: {
      type: String,
      trim: true,
      default: 'Demo/indicative price. Subject to laboratory verification.',
    },
    isActive: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
)

testSchema.index({ name: 'text', shortCode: 'text', description: 'text' })

export const Test = mongoose.models.Test || mongoose.model('Test', testSchema)
