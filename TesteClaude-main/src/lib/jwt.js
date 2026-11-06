/**
 * src/lib/jwt.js
 *
 * Centraliza criação e verificação de tokens JWT.
 *
 * ACCESS TOKEN  — vida curta (15 min), transmitido no header Authorization.
 * REFRESH TOKEN — vida longa (7 dias), armazenado em cookie httpOnly.
 *
 * Correção SEC-01: secrets lidos via config (que é importado APÓS dotenv.config()
 * no server.js), não no require-time deste módulo.
 */

const jwt    = require("jsonwebtoken");
const config = require("../config");
const { UnauthorizedError } = require("../errors/AppError");

const { accessSecret, refreshSecret, accessTtl, refreshTtl } = config.jwt;

/**
 * Gera um access token.
 * @param {{ id: number, email: string, role: string }} payload
 * @returns {string}
 */
const signAccess = (payload) =>
  jwt.sign(payload, accessSecret, { expiresIn: accessTtl, algorithm: "HS256" });

/**
 * Gera um refresh token (contém apenas o id do usuário).
 * @param {{ id: number }} payload
 * @returns {string}
 */
const signRefresh = (payload) =>
  jwt.sign(payload, refreshSecret, { expiresIn: refreshTtl, algorithm: "HS256" });

/**
 * Verifica e decodifica um access token.
 * Lança UnauthorizedError para token inválido ou expirado.
 * @param {string} token
 * @returns {object}
 */
const verifyAccess = (token) => {
  try {
    return jwt.verify(token, accessSecret, { algorithms: ["HS256"] });
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado.");
  }
};

/**
 * Verifica e decodifica um refresh token.
 * @param {string} token
 * @returns {object}
 */
const verifyRefresh = (token) => {
  try {
    return jwt.verify(token, refreshSecret, { algorithms: ["HS256"] });
  } catch {
    throw new UnauthorizedError("Refresh token inválido ou expirado.");
  }
};

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
