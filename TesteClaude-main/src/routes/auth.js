/**
 * src/routes/auth.js
 *
 * Rotas de autenticação.
 *
 * POST /auth/login       — pública, com rate limit estrito
 * POST /auth/refresh     — pública, com rate limit estrito
 * POST /auth/logout      — autenticada
 * POST /auth/logout-all  — autenticada
 */

const { Router }      = require("express");
const ctrl            = require("../controllers/authController");
const authenticate    = require("../middlewares/authenticate");
const asyncHandler    = require("../middlewares/asyncHandler");
const { authLimiter } = require("../middlewares/rateLimiter");

const router = Router();

router.post("/login",      authLimiter,              asyncHandler(ctrl.login));
router.post("/refresh",    authLimiter,              asyncHandler(ctrl.refresh));
router.post("/logout",     authenticate,             asyncHandler(ctrl.logout));
router.post("/logout-all", authenticate,             asyncHandler(ctrl.logoutAll));

module.exports = router;
