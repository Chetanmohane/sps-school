const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const academicAdminController = require("../controllers/academicAdminController");

const allowedAcademicRoles = ["academic-admin", "super-admin", "manager-admin", "teacher-admin", "student-admin", "operations-admin", "teacher", "class-teacher"];

// ==================== DASHBOARD ====================
router.get("/dashboard-stats", auth, role(allowedAcademicRoles), academicAdminController.getDashboardStats);

// ==================== TEACHER ROUTES ====================
router.get("/teachers", auth, role(allowedAcademicRoles), academicAdminController.getAllTeachers);
router.get("/teachers/:teacherId", auth, role(allowedAcademicRoles), academicAdminController.getTeacherById);
router.post("/teachers", auth, role(allowedAcademicRoles), academicAdminController.createTeacher);
router.put("/teachers/:teacherId", auth, role(allowedAcademicRoles), academicAdminController.updateTeacher);
router.delete("/teachers/:teacherId", auth, role(allowedAcademicRoles), academicAdminController.deleteTeacher);

// ==================== SUBJECT ROUTES ====================
router.get("/subjects", auth, role(allowedAcademicRoles), academicAdminController.getAllSubjects);
router.get("/subjects/:subjectId", auth, role(allowedAcademicRoles), academicAdminController.getSubjectById);
router.post("/subjects", auth, role(allowedAcademicRoles), academicAdminController.createSubject);
router.put("/subjects/:subjectId", auth, role(allowedAcademicRoles), academicAdminController.updateSubject);
router.delete("/subjects/:subjectId", auth, role(allowedAcademicRoles), academicAdminController.deleteSubject);

// ==================== CLASS ROUTES ====================
router.get("/classes", auth, role(allowedAcademicRoles), academicAdminController.getAllClasses);
router.get("/classes/:classId", auth, role(allowedAcademicRoles), academicAdminController.getClassById);
router.post("/classes", auth, role(allowedAcademicRoles), academicAdminController.createClass);
router.put("/classes/update-global-timings", auth, role(allowedAcademicRoles), academicAdminController.updateGlobalClassTimings);
router.put("/classes/:classId", auth, role(allowedAcademicRoles), academicAdminController.updateClass);
router.delete("/classes/:classId", auth, role(allowedAcademicRoles), academicAdminController.deleteClass);
router.post("/classes/:classId/assign-subjects", auth, role(allowedAcademicRoles), academicAdminController.assignSubjectsToClass);
router.put("/classes/:classId/assign-class-teacher", auth, role(allowedAcademicRoles), academicAdminController.assignClassTeacher);
router.get("/classes/:classId/subject-teachers", auth, role(allowedAcademicRoles), academicAdminController.getClassSubjectTeachers);

module.exports = router;