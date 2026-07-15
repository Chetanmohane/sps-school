const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const controller = require("../controllers/teacherController");

router.get("/my-classes/:email", auth, role("teacher"), controller.getMyClasses);

module.exports = router;