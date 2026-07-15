const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const assignmentController = require("../controllers/assignmentController");

router.post("/create", auth, role("teacher"), assignmentController.createAssignment);
router.get("/all", auth, role(["teacher", "student"]), assignmentController.getAssignments);
router.get("/submit", auth, role("teacher"), assignmentController.getAssignmentSubmissions);
router.post("/submit", auth, role("student"), assignmentController.submitAssignment);
router.get("/my-submissions", auth, role("student"), assignmentController.getMySubmissions);
router.put("/update-marks/:submissionId", auth, role("teacher"), assignmentController.updateMarks);

module.exports = router;