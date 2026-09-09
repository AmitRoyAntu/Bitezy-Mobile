const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Coupon code is required"],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ["percent", "flat", "delivery"],
    default: "percent",
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, "Discount value is required"],
    min: [0, "Discount value cannot be negative"],
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, "Minimum order amount cannot be negative"],
  },
  maxDiscount: {
    type: Number,
    default: null,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  usageLimit: {
    type: Number,
    default: null,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
}, { timestamps: true });

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
