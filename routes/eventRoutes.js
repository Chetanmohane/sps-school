const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const eventController = require("../controllers/eventController");

router.get("/all", auth, eventController.getEvents);
router.post("/create", auth, role(["operations-admin", "super-admin"]), eventController.createEvent);
router.put("/:id", auth, role(["operations-admin", "super-admin"]), eventController.updateEvent);
router.delete("/:id", auth, role(["operations-admin", "super-admin"]), eventController.deleteEvent);

module.exports = router;