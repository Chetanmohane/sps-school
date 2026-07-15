const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const academicAdminController = require("../controllers/academicAdminController");

// ==================== DASHBOARD ====================
router.get("/dashboard-stats", auth, role(["academic-admin", "super-admin"]), academicAdminController.getDashboardStats);

// ==================== TEACHER ROUTES ====================
router.get("/teachers", auth, role(["academic-admin", "super-admin"]), academicAdminController.getAllTeachers);
router.get("/teachers/:teacherId", auth, role(["academic-admin", "super-admin"]), academicAdminController.getTeacherById);
router.post("/teachers", auth, role(["academic-admin", "super-admin"]), academicAdminController.createTeacher);
router.put("/teachers/:teacherId", auth, role(["academic-admin", "super-admin"]), academicAdminController.updateTeacher);
router.delete("/teachers/:teacherId", auth, role(["academic-admin", "super-admin"]), academicAdminController.deleteTeacher);

// ==================== SUBJECT ROUTES ====================
router.get("/subjects", auth, role(["academic-admin", "super-admin"]), academicAdminController.getAllSubjects);
router.get("/subjects/:subjectId", auth, role(["academic-admin", "super-admin"]), academicAdminController.getSubjectById);
router.post("/subjects", auth, role(["academic-admin", "super-admin"]), academicAdminController.createSubject);
router.put("/subjects/:subjectId", auth, role(["academic-admin", "super-admin"]), academicAdminController.updateSubject);
router.delete("/subjects/:subjectId", auth, role(["academic-admin", "super-admin"]), academicAdminController.deleteSubject);

// ==================== CLASS ROUTES ====================
router.get("/classes", auth, role(["academic-admin", "super-admin"]), academicAdminController.getAllClasses);
router.get("/classes/:classId", auth, role(["academic-admin", "super-admin"]), academicAdminController.getClassById);
router.post("/classes", auth, role(["academic-admin", "super-admin"]), academicAdminController.createClass);
router.put("/classes/:classId", auth, role(["academic-admin", "super-admin"]), academicAdminController.updateClass);
router.delete("/classes/:classId", auth, role(["academic-admin", "super-admin"]), academicAdminController.deleteClass);
router.post("/classes/:classId/assign-subjects", auth, role(["academic-admin", "super-admin"]), academicAdminController.assignSubjectsToClass);

module.exports = router;