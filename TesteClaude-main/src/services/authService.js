/**
 * src/services/authService.js
 *
 * Lógica de negócio para autenticação.
 * Orquestra login, rotação de refresh token, logout e auditoria.
 *
 * Correções aplicadas:
 *   BUG-02 — timingSafeCompare usa hash válido pré-computado, sem exceção
 *   SEC-04 — refresh verifica user.isActive antes de emitir novos tokens
 *   MAN-02 — usa constantes AuditAction
 */

const userRepo         = require("../repositories/userRepository");
const refreshTokenRepo = require("../repositories/refreshTokenRepository");
const auditRepo        = require("../repositories/auditRepository");
const password         = require("../lib/password");
const jwt              = require("../lib/jwt");
const config           = require("../config");
const { AuditAction }  = require("../constants/auditActions");
const { UnauthorizedError } = require("../errors/AppError");

/**
 * Autentica o usuário com e-mail e senha.
 * Timing-safe: executa bcrypt mesmo quando o usuário não existe (OWASP API2).
 *
 * @param {string} email
 * @param {string} plainPassword
 * @param {string} ip
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
const login = async (email, plainPassword, ip) => {
  const user = await userRepo.findByEmailWithPassword(email);

  // Sempre executa bcrypt — evita timing attack / user enumeration
  const isValid = user
    ? await password.verify(plainPassword, user.passwordHash)
    : await password.timingSafeCompare(plainPassword);

  if (!user || !isValid || !user.isActive) {
    await auditRepo.log({ action: AuditAction.LOGIN_FAILED, meta: { email }, ip });
    throw new UnauthorizedError("Credenciais inválidas.");
  }

  const { passwordHash: _removed, ...safeUser } = user;

  const accessToken  = jwt.signAccess({ id: user.id, email: user.email, role: user.role });
  const refreshToken = jwt.signRefresh({ id: user.id });
  const expiresAt    = new Date(Date.now() + config.jwt.refreshTtlMs);

  await refreshTokenRepo.create(user.id, refreshToken, expiresAt);
  await auditRepo.log({ userId: user.id, action: AuditAction.LOGIN_SUCCESS, ip });

  return { accessToken, refreshToken, user: safeUser };
};

/**
 * Rotação de refresh token: invalida o anterior e emite um novo par.
 * Reutilização de token revogado aciona revogação total (breach response).
 * Verifica isActive para bloquear usuários desativados (SEC-04).
 *
 * @param {string} oldRefreshToken
 * @param {string} ip
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const refresh = async (oldRefreshToken, ip) => {
  // Verifica assinatura e expiração JWT antes de consultar o banco
  const decoded = jwt.verifyRefresh(oldRefreshToken);
  const stored  = await refreshTokenRepo.findValid(oldRefreshToken);

  if (!stored || stored.userId !== decoded.id) {
    // Possível reutilização de token revogado — revoga tudo do usuário
    if (decoded?.id) {
      await refreshTokenRepo.revokeAllForUser(decoded.id);
    }
    await auditRepo.log({
      action: AuditAction.REFRESH_TOKEN_REUSE,
      meta:   { userId: decoded?.id },
      ip,
    });
    throw new UnauthorizedError("Refresh token inválido.");
  }

  // Garante que o usuário continua ativo (SEC-04)
  if (!stored.user.isActive) {
    await refreshTokenRepo.revokeAllForUser(stored.userId);
    throw new UnauthorizedError("Conta desativada.");
  }

  // Revoga o token antigo (rotação obrigatória)
  await refreshTokenRepo.revoke(oldRefreshToken);

  const { user }     = stored;
  const accessToken  = jwt.signAccess({ id: user.id, email: user.email, role: user.role });
  const refreshToken = jwt.signRefresh({ id: user.id });
  const expiresAt    = new Date(Date.now() + config.jwt.refreshTtlMs);

  await refreshTokenRepo.create(user.id, refreshToken, expiresAt);

  return { accessToken, refreshToken };
};

/**
 * Revoga o refresh token corrente (logout do dispositivo atual).
 * @param {string} refreshToken
 * @param {number} userId
 * @param {string} ip
 */
const logout = async (refreshToken, userId, ip) => {
  await refreshTokenRepo.revoke(refreshToken);
  await auditRepo.log({ userId, action: AuditAction.LOGOUT, ip });
};

/**
 * Revoga todos os refresh tokens do usuário (logout de todos os dispositivos).
 * @param {number} userId
 * @param {string} ip
 */
const logoutAll = async (userId, ip) => {
  await refreshTokenRepo.revokeAllForUser(userId);
  await auditRepo.log({ userId, action: AuditAction.LOGOUT_ALL, ip });
};

module.exports = { login, refresh, logout, logoutAll };
