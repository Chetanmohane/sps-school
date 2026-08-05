const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const controller = require("../controllers/notificationController");

router.get("/", auth, controller.getNotifications);
router.post("/", auth, role(["super-admin", "manager-admin"]), controller.createNotification);
router.delete("/:id", auth, role(["super-admin", "manager-admin"]), controller.deleteNotification);
router.put("/:id", auth, role(["super-admin", "manager-admin"]), controller.updateNotification);

module.exports = router;
