const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const controller = require("../controllers/teacherController");

const allowedTeacherRoles = ["teacher", "super-admin", "manager-admin", "academic-admin", "teacher-admin", "student-admin", "operations-admin"];

router.get("/my-classes/:email", auth, role(allowedTeacherRoles), controller.getMyClasses);
router.get("/profile-info/:email", auth, role(allowedTeacherRoles), controller.getTeacherProfileInfo);
router.get("/class-students/:email", auth, role(allowedTeacherRoles), controller.getClassTeacherStudents);
router.get("/class-summary/:email", auth, role(allowedTeacherRoles), controller.getClassTeacherSummary);

module.exports = router;