/**
 * src/middlewares/authenticate.js
 *
 * Extrai e valida o JWT do header Authorization.
 * Popula req.user com { id, email, role } após verificação bem-sucedida.
 *
 * Correção BUG-03: erros síncronos agora são passados via next(err) em vez
 * de lançados diretamente — garante que o errorHandler global os capture.
 *
 * OWASP API2 — autenticação obrigatória em rotas protegidas.
 */

const jwtLib = require("../lib/jwt");
const { UnauthorizedError } = require("../errors/AppError");

/**
 * @param {import("express").Request}  req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader?.startsWith("Bearer ")) {
      return next(new UnauthorizedError("Token de autenticação ausente."));
    }

    const token = authHeader.slice(7); // remove o prefixo "Bearer "
    req.user = jwtLib.verifyAccess(token);

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
