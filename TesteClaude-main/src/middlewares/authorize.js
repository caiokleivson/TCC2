/**
 * src/middlewares/authorize.js
 *
 * Fábrica de middleware para controle de acesso baseado em roles (RBAC).
 * Deve ser usado após o middleware authenticate.
 *
 * Correção BUG-04: erros síncronos passados via next(err).
 *
 * OWASP API5 — controle de acesso em nível de função.
 *
 * @param {...string} roles  Roles permitidas (ex: "ADMIN", "USER")
 * @returns {import("express").RequestHandler}
 *
 * @example
 * router.get("/admin", authenticate, authorize("ADMIN"), handler);
 */

const { ForbiddenError } = require("../errors/AppError");

const authorize = (...roles) => (req, _res, next) => {
  try {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authorize;
