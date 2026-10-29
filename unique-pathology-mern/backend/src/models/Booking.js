import mongoose from 'mongoose'

const bookingItemSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ['test', 'package'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: false },
    name: { type: String, required: true },
    code: { type: String },
    pricePaise: { type: Number, required: true, min: 0 },
    isVerifiedPrice: { type: Boolean, default: false },
  },
  { _id: false }
)

const bookingSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    // Patient details (minimum necessary data)
    patientName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: {
      type: String,
      required: true,
      index: true,
      match: /^[6-9][0-9]{9}$/,
    },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
    age: { type: Number, min: 0, max: 130 },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },

    // Selected tests / packages
    items: {
      type: [bookingItemSchema],
      validate: [v => Array.isArray(v) && v.length > 0, 'At least one test or package must be selected.'],
    },
    subtotalPaise: { type: Number, default: 0, min: 0 },
    discountAmountPaise: { type: Number, default: 0, min: 0 },
    totalAmountPaise: { type: Number, required: true, min: 0 },
    hasUnverifiedPrices: { type: Boolean, default: false },

    // Offer / Campaign integration
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      index: true,
      default: null,
    },
    offerName: { type: String, trim: true },
    offerCode: { type: String, trim: true, uppercase: true },
    appliedCampaign: { type: String, trim: true },
    originalPricePaise: { type: Number, default: 0 },
    offerDiscountPaise: { type: Number, default: 0 },

    // Doctor referral & billing integration
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true,
      default: null,
    },
    doctorName: { type: String, trim: true },
    doctorDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    commissionPaise: { type: Number, default: 0, min: 0 },
    referredBy: {
      type: String,
      enum: ['self', 'doctor', 'clinic'],
      default: 'self',
      index: true,
    },

    // Appointment preference
    date: { type: String, required: true }, // Format YYYY-MM-DD
    timeSlot: {
      type: String,
      required: true,
      enum: [
        '07:00 AM - 09:00 AM',
        '09:00 AM - 11:00 AM',
        '11:00 AM - 01:00 PM',
        '01:00 PM - 03:00 PM',
        '03:00 PM - 05:00 PM',
        '05:00 PM - 07:00 PM',
      ],
      default: '07:00 AM - 09:00 AM',
    },
    collectionType: {
      type: String,
      enum: ['centre', 'home'],
      required: true,
      default: 'centre',
    },

    // Home collection details
    address: { type: String, maxlength: 400, trim: true },
    landmark: { type: String, maxlength: 150, trim: true },
    city: { type: String, default: 'Mandideep', trim: true },
    pinCode: { type: String, match: /^[0-9]{6}$/, trim: true },

    // Workflow status
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'sample_collected', 'processing', 'completed', 'cancelled'],
      default: 'requested',
      index: true,
    },
    cancellationReason: { type: String, trim: true, maxlength: 300 },
    cancelledAt: { type: Date },

    // Payment state
    paymentStatus: {
      type: String,
      enum: ['not_started', 'pending', 'paid', 'failed', 'refunded'],
      default: 'not_started',
      index: true,
    },
    razorpayOrderId: { type: String, sparse: true, index: true },
    razorpayPaymentId: { type: String, sparse: true },
    paidAt: { type: Date },

    // Operations notes & Phlebotomist assignment
    assignedPhlebotomist: { type: String, trim: true },
    adminNotes: { type: String, trim: true, maxlength: 500 },

    // Patient consent
    consent: { type: Boolean, required: true },
  },
  { timestamps: true }
)

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
