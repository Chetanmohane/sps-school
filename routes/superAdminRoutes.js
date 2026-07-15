const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const controller = require("../controllers/superAdminController");

router.get('/role/:role', auth, role("super-admin"), controller.getAdminsByRole);
router.post('/create-admin', auth, role("super-admin"), controller.createSpecializedAdmin);
router.delete('/delete-admin/:id', auth, role("super-admin"), controller.deleteAdmin);

module.exports = router;