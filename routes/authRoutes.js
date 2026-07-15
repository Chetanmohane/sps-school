const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post('/password-reset', authController.simplePasswordReset);
router.post('/update-username', authController.updateUsername);

module.exports = router;