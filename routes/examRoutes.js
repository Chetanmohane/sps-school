const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Routes
router.post("/", auth, role(["super-admin", "manager-admin", "academic-admin"]), examController.createExam);
router.get("/", auth, examController.getAllExams); // everyone can get exams
router.delete("/:id", auth, role(["super-admin", "manager-admin", "academic-admin"]), examController.deleteExam);

module.exports = router;
