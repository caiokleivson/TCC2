const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");

const { jwtSecret } = require("../config/env");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(
      new AppError(
        "Token não informado.",
        401
      )
    );
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = {
      id: decoded.userId
    };

    next();
  } catch {
    next(
      new AppError(
        "Token inválido.",
        401
      )
    );
  }
}

module.exports = authMiddleware;