/**
 * src/routes/index.js
 *
 * Ponto central de registro de todas as rotas sob /api/v1.
 * Adicionar novos recursos aqui sem tocar no app.js.
 */

const { Router } = require("express");
const authRouter  = require("./auth");
const usersRouter = require("./users");

const router = Router();

router.use("/auth",  authRouter);
router.use("/users", usersRouter);

module.exports = router;
