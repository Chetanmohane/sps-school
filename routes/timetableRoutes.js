const express = require("express");
const router = express.Router();
const { getTimetable, createOrUpdateTimetable, deleteTimetable, getMyTimetable, getTeacherSchedule } = require("../controllers/timetableController");

router.get("/teacher-schedule", getTeacherSchedule);
router.get("/my-timetable", getMyTimetable);
router.get("/", getTimetable);
router.post("/", createOrUpdateTimetable);
router.delete("/:id", deleteTimetable);

module.exports = router;
