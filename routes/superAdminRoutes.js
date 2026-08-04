const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const controller = require("../controllers/superAdminController");

router.get('/role/:role', auth, role(["super-admin", "manager-admin"]), controller.getAdminsByRole);
router.get('/audit-logs', auth, role(["super-admin", "manager-admin", "academic-admin"]), controller.getAuditLogs);
router.post('/create-admin', auth, role(["super-admin", "manager-admin"]), controller.createSpecializedAdmin);
router.delete('/delete-admin/:id', auth, role(["super-admin", "manager-admin"]), controller.deleteAdmin);
router.put('/update-admin/:id', auth, role(["super-admin", "manager-admin"]), controller.updateAdmin);

module.exports = router;