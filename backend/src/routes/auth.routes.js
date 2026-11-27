const express = require("express");
const { rateLimit } = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

const limitAuth = (limit, skipSuccessfulRequests = false) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  skipSuccessfulRequests,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, message: "Demasiados intentos. Vuelve a intentarlo más tarde." },
});

router.post("/register", limitAuth(10), authController.register);
router.post("/login", limitAuth(10, true), authController.login);
router.get("/me", requireAuth, authController.me);
router.patch("/profile", requireAuth, limitAuth(10, true), authController.updateProfile);

module.exports = router;
