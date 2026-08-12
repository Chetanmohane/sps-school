const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const financeController = require("../controllers/financeController");

const allowedFinanceRoles = ["finance-admin", "super-admin", "manager-admin", "operations-admin"];
const allRoles = ["student", "finance-admin", "super-admin", "manager-admin", "operations-admin"];

router.post("/create-fee", auth, role(allowedFinanceRoles), financeController.createFee);
router.get("/all", auth, role(allowedFinanceRoles), financeController.getAllFees);
router.get("/my-fees", auth, role(allRoles), financeController.getMyFees);
router.post("/pay/:feeId", auth, role(allRoles), financeController.payFee);
router.put("/update/:feeId", auth, role(allowedFinanceRoles), financeController.updateFee);
router.delete("/delete/:feeId", auth, role(allowedFinanceRoles), financeController.deleteFee);

module.exports = router;