/**
 * src/routes/users.js
 *
 * Rotas de gerenciamento de usuários.
 * Todas exigem autenticação via JWT.
 *
 * GET    /users      — ADMIN: lista com paginação
 * GET    /users/:id  — ADMIN: qualquer usuário | USER: apenas próprio perfil
 * POST   /users      — ADMIN: cria usuário
 * PUT    /users/:id  — ADMIN: qualquer | USER: apenas si mesmo
 * DELETE /users/:id  — ADMIN: qualquer | USER: apenas si mesmo
 */

const { Router }       = require("express");
const ctrl             = require("../controllers/userController");
const authenticate     = require("../middlewares/authenticate");
const authorize        = require("../middlewares/authorize");
const asyncHandler     = require("../middlewares/asyncHandler");
const { writeLimiter } = require("../middlewares/rateLimiter");

const router = Router();

// Autenticação obrigatória em todas as rotas abaixo
router.use(authenticate);

// Leitura
router.get("/",    authorize("ADMIN"),           asyncHandler(ctrl.listUsers));
router.get("/:id",                               asyncHandler(ctrl.getUser));

// Escrita (com rate limit adicional)
router.post  ("/",    writeLimiter,              asyncHandler(ctrl.createUser));
router.put   ("/:id", writeLimiter,              asyncHandler(ctrl.updateUser));
router.delete("/:id", writeLimiter,              asyncHandler(ctrl.deleteUser));

module.exports = router;
