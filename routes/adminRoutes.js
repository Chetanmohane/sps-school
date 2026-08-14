const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const studentAdminController = require("../controllers/studentAdminController");

const allowedRoles = ["student-admin", "super-admin", "manager-admin", "academic-admin", "teacher-admin", "operations-admin", "admin", "finance-admin", "teacher", "class-teacher"];

// ==================== STUDENT ADMIN ROUTES ====================
router.get("/student-admin/dashboard-stats", auth, role(allowedRoles), studentAdminController.getDashboardStats);

// ===== ADMISSIONS MANAGEMENT =====
router.get("/student-admin/admissions/pending", auth, role(allowedRoles), studentAdminController.getPendingAdmissions);
router.get("/student-admin/admissions", auth, role(allowedRoles), studentAdminController.getAllAdmissions);
router.post("/student-admin/admissions/new", auth, role(allowedRoles), studentAdminController.createAdmission);
router.post("/student-admin/admissions/direct", auth, role(allowedRoles), studentAdminController.createDirectAdmission);
router.post("/student-admin/admissions/:admissionId/approve", auth, role(allowedRoles), studentAdminController.approveAdmission);
router.post("/student-admin/admissions/:admissionId/reject", auth, role(allowedRoles), studentAdminController.rejectAdmission);
router.delete("/student-admin/admissions/:admissionId", auth, role(allowedRoles), studentAdminController.deleteAdmission);

// ===== STUDENT PROFILES =====
router.get("/student-admin/students", auth, role(allowedRoles), studentAdminController.getAllStudents);
router.get("/student-admin/students/:studentId", auth, role(allowedRoles), studentAdminController.getStudentProfile);
router.post('/student-admin/create-student', auth, role(allowedRoles), studentAdminController.createStudent);
router.post('/student-admin/students', auth, role(allowedRoles), studentAdminController.createStudent);
router.put("/student-admin/students/:studentId", auth, role(allowedRoles), studentAdminController.updateStudentProfile);
router.delete("/student-admin/students/:studentId", auth, role(allowedRoles), studentAdminController.deleteStudent);

// ===== CLASS ALLOCATION =====
router.get("/student-admin/classes", auth, role(allowedRoles), studentAdminController.getAllClassNames);
router.get("/student-admin/classes/:className/students", studentAdminController.getStudentsByClass);
router.get("/student-admin/allocation/unallocated", auth, role(allowedRoles), studentAdminController.getUnallocatedStudents);
router.post("/student-admin/allocation/:studentId", auth, role(allowedRoles), studentAdminController.allocateToClass);

// ===== PROMOTIONS =====
router.get("/student-admin/promotions/history", auth, role(allowedRoles), studentAdminController.getPromotionHistory);
router.post("/student-admin/promotions/bulk", auth, role(allowedRoles), studentAdminController.promoteStudents);
router.post("/student-admin/promotions/:studentId", auth, role(allowedRoles), studentAdminController.promoteSingleStudent);

// ===== RESULTS =====
router.get("/student-admin/results/:studentId", auth, role(allowedRoles), studentAdminController.getStudentResults);
router.post("/student-admin/results/:studentId", auth, role(allowedRoles), studentAdminController.updateStudentResults);


module.exports = router;