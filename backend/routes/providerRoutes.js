const express = require("express");
const router = express.Router();
const {
    getProviders,
    getProviderById,
    getMyProvider,
    getAdminSellers,
    toggleProviderBlock,
    updateProvider,
} = require("../controllers/providerController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.get("/", getProviders);
router.get("/admin/sellers", protect, authorize("admin"), getAdminSellers);
router.get("/myprovider", protect, authorize("seller"), getMyProvider);
router.put("/:id/block", protect, authorize("admin"), toggleProviderBlock);
router.put("/:id", protect, authorize("seller", "admin"), updateProvider);
router.get("/:id", getProviderById);

module.exports = router;
