import mongoose from 'mongoose'

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 150 },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, maxlength: 30 },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['Preventive Wellness', 'Senior Care', 'Diabetic Care', 'Women Health', 'Executive Health'],
      default: 'Preventive Wellness',
    },
    tagline: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    testsIncluded: [{ type: String, trim: true }],
    testCount: { type: Number, default: 0 },
    fastingRequired: { type: Boolean, default: true },
    fastingInstructions: {
      type: String,
      trim: true,
      default: '10–12 hours overnight fasting recommended. Water is permitted.',
    },
    sampleType: { type: String, default: 'Blood & Spot Urine' },
    pricePaise: { type: Number, required: true, min: 0 },
    mrpPaise: { type: Number, default: 0 },
    isVerifiedPrice: { type: Boolean, default: false },
    priceNote: {
      type: String,
      trim: true,
      default: 'Demo/indicative package pricing. Subject to laboratory verification.',
    },
    badge: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
)

packageSchema.pre('save', function (next) {
  if (this.testsIncluded && Array.isArray(this.testsIncluded)) {
    this.testCount = this.testsIncluded.length
  }
  next()
})

export const Package = mongoose.models.Package || mongoose.model('Package', packageSchema)
