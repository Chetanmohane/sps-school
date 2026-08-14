const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const assignmentController = require("../controllers/assignmentController");

const allowedStaffRoles = ["teacher", "class-teacher", "super-admin", "superadmin", "academic-admin", "manager-admin", "teacher-admin", "operations-admin"];

router.post("/create", auth, role(allowedStaffRoles), assignmentController.createAssignment);
router.get("/all", auth, role([...allowedStaffRoles, "student"]), assignmentController.getAssignments);
router.get("/submit", auth, role(allowedStaffRoles), assignmentController.getAssignmentSubmissions);
router.post("/submit", auth, role(["student", ...allowedStaffRoles]), assignmentController.submitAssignment);
router.get("/my-submissions", auth, role(["student", ...allowedStaffRoles]), assignmentController.getMySubmissions);
router.put("/update-marks/:submissionId", auth, role(allowedStaffRoles), assignmentController.updateMarks);
router.delete("/delete/:id", auth, role(allowedStaffRoles), assignmentController.deleteAssignment);

module.exports = router;