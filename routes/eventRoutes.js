const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const eventController = require("../controllers/eventController");

const allowedAdminRoles = ["operations-admin", "super-admin", "manager-admin", "academic-admin"];

router.get("/all", auth, eventController.getEvents);
router.post("/create", auth, role(allowedAdminRoles), eventController.createEvent);
router.put("/:id", auth, role(allowedAdminRoles), eventController.updateEvent);
router.delete("/:id", auth, role(allowedAdminRoles), eventController.deleteEvent);

module.exports = router;