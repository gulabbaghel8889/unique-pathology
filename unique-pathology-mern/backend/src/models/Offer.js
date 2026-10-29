import mongoose from 'mongoose'

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
      maxlength: 30,
      index: true,
      sparse: true,
    },
    offerType: {
      type: String,
      enum: ['festival', 'seasonal', 'health_camp', 'special_package', 'senior_citizen', 'general'],
      default: 'festival',
      index: true,
    },
    badgeText: {
      type: String,
      trim: true,
      maxlength: 60,
      default: 'Special Campaign Offer',
    },
    bannerGradient: {
      type: String,
      default: 'from-amber-500 via-rose-500 to-red-600',
    },
    bannerUrl: {
      type: String,
      trim: true,
    },
    // Applicability rules
    applicabilityType: {
      type: String,
      enum: ['all', 'category', 'package', 'test'],
      default: 'all',
      required: true,
    },
    applicableCategories: [{
      type: String,
      trim: true,
    }],
    applicablePackageIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
    }],
    applicableTestIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
    }],

    // Discount calculations
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'offer_price'],
      required: true,
      default: 'percentage',
    },
    // For percentage: 25 = 25%
    // For fixed_amount: 50000 = Rs 500 in paise
    // For offer_price: 149900 = Rs 1,499 in paise
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Validity schedule
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Status and display priority
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },
    maxUsageCount: {
      type: Number,
      default: null,
    },
    currentUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    terms: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Dynamic status resolution based on current time
offerSchema.virtual('computedStatus').get(function () {
  if (!this.isActive) return 'inactive'
  const now = new Date()
  if (this.startDate && now < this.startDate) return 'scheduled'
  if (this.endDate && now > this.endDate) return 'expired'
  return 'active'
})

export const Offer = mongoose.models.Offer || mongoose.model('Offer', offerSchema)
