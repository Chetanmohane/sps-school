const express = require("express");
const router = express.Router();

const controller = require("../controllers/applicationController");

router.post("/send", controller.sendApplication);
router.get("/all", controller.getAllApplications);
router.get("/by-class", controller.getByClass);
router.patch("/status/:id", controller.updateStatus);
router.delete("/:id", controller.deleteApplication);

module.exports = router;