const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");

router.get("/list", attendanceController.getStudentsForAttendance);
router.post("/bulkSubmit", attendanceController.submitBulkAttendance);
router.get("/all", attendanceController.getAllAttendance);
router.get("/:email", attendanceController.getAttendance);
module.exports = router;