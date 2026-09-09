const express = require("express");
const router = express.Router();
const {
  validateCoupon,
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
  deleteCoupon,
} = require("../controllers/couponController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Customer / All Users: Validate coupon during cart checkout
router.post("/validate", protect, validateCoupon);
router.get("/active", getActiveCoupons);

// Admin Only routes
router.get("/", protect, authorize("admin"), getAllCoupons);
router.post("/", protect, authorize("admin"), createCoupon);
router.patch("/:id/toggle", protect, authorize("admin"), toggleCouponStatus);
router.delete("/:id", protect, authorize("admin"), deleteCoupon);

module.exports = router;
