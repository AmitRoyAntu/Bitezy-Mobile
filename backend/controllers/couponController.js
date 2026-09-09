const Coupon = require("../models/Coupon");

// POST /api/coupons/validate (Private - Buyer/Seller/Admin)
const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal, orderType } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ message: "Please enter a coupon code" });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ message: "Invalid or inactive coupon code" });
    }

    // Check expiration
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ message: "This coupon code has expired" });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "This coupon has reached its maximum usage limit" });
    }

    // Check minimum order amount
    const cartSubtotal = Number(subtotal) || 0;
    if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order of ৳${coupon.minOrderAmount} required to use code ${coupon.code}`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    const isDelivery = String(orderType || "delivery").toLowerCase() === "delivery";

    if (coupon.discountType === "percent") {
      discountAmount = Math.round((cartSubtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === "flat") {
      discountAmount = Math.min(cartSubtotal, coupon.discountValue);
    } else if (coupon.discountType === "delivery") {
      discountAmount = isDelivery ? (coupon.discountValue || 30) : 0;
    }

    res.json({
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description || `${coupon.discountValue}${coupon.discountType === 'percent' ? '% off' : ' off'}`,
        minOrderAmount: coupon.minOrderAmount,
      },
      discountAmount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/coupons (Private - Admin only)
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/coupons (Private - Admin only)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      description,
      expiresAt,
      usageLimit,
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ message: `Coupon code '${cleanCode}' already exists` });
    }

    if (!discountValue || Number(discountValue) <= 0) {
      return res.status(400).json({ message: "Discount value must be greater than 0" });
    }

    const coupon = new Coupon({
      code: cleanCode,
      discountType: discountType || "percent",
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      description: description ? description.trim() : "",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      createdBy: req.user ? req.user._id : null,
      isActive: true,
    });

    const saved = await coupon.save();
    res.status(201).json(saved);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/coupons/:id/toggle (Private - Admin only)
const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    const updated = await coupon.save();
    res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/coupons/:id (Private - Admin only)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json({ message: "Coupon deleted successfully", id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/coupons/active (Protected for all logged in users)
const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  validateCoupon,
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
};
