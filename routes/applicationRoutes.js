const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicationController");

router.post("/send", controller.sendApplication);
router.get("/all", controller.getAllApplications);
router.patch("/status/:id", controller.updateStatus);

module.exports = router;