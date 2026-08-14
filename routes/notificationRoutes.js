const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const controller = require("../controllers/notificationController");

const allowedRoles = ["super-admin", "manager-admin", "academic-admin", "student-admin", "operations-admin", "teacher", "class-teacher"];

router.get("/", auth, controller.getNotifications);
router.post("/", auth, role(allowedRoles), controller.createNotification);
router.delete("/:id", auth, role(allowedRoles), controller.deleteNotification);
router.put("/:id", auth, role(allowedRoles), controller.updateNotification);

module.exports = router;
