import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: [/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit Indian mobile number.'],
    },
    password: {
      type: String,
      required: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: [0, 'Discount percentage cannot be less than 0.'],
      max: [100, 'Discount percentage cannot exceed 100.'],
      default: 10,
    },
    commissionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    specialization: {
      type: String,
      default: 'General Physician',
      trim: true,
      maxlength: 100,
    },
    qualification: {
      type: String,
      default: 'MBBS',
      trim: true,
      maxlength: 100,
    },
    clinicName: {
      type: String,
      default: 'Private Clinic',
      trim: true,
      maxlength: 150,
    },
    clinicAddress: {
      type: String,
      default: 'Mandideep, Bhopal Region, M.P.',
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    totalReferredPatients: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTestsReferred: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenuePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarningsPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
)

export const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema)
