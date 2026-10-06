const express = require("express");
const reminderController = require("../controllers/reminder.controller");

const router = express.Router();

router.get("/", reminderController.listReminders);
router.post("/", reminderController.createReminder);
router.put("/:id", reminderController.updateReminder);
router.patch("/:id/complete", reminderController.completeReminder);
router.delete("/:id", reminderController.removeReminder);

module.exports = router;
