const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const studentController = require("../controllers/studentController");

router.get("/all-students", studentController.getAllStudents);
router.get("/profile/:email", studentController.getStudent);

module.exports = router;