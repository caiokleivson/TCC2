/**
 * src/controllers/authController.js
 *
 * Camada HTTP para autenticação.
 * Responsabilidade: ler req, delegar ao service, escrever res.
 * Sem lógica de negócio aqui.
 *
 * Correções aplicadas:
 *   BUG-05 — refresh token ausente agora lança UnauthorizedError (padrão uniforme)
 *   ORG-01 — usa parseBody compartilhado
 *   ORG-06 — COOKIE_OPTS vem do config centralizado
 */

const authService   = require("../services/authService");
const { loginSchema } = require("../validators/authValidator");
const { parseBody }   = require("../lib/parseBody");
const config          = require("../config");
const { UnauthorizedError } = require("../errors/AppError");

const { refreshTokenName, options: COOKIE_OPTS } = config.cookie;

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Autentica com e-mail + senha. Devolve access token no body e
 * refresh token em cookie httpOnly.
 */
const login = async (req, res) => {
  const { email, password } = parseBody(loginSchema, req.body);

  const { accessToken, refreshToken, user } = await authService.login(
    email,
    password,
    req.ip
  );

  res.cookie(refreshTokenName, refreshToken, COOKIE_OPTS);
  res.json({ accessToken, user });
};

/**
 * POST /auth/refresh
 * Renova o access token usando o refresh token do cookie.
 * Rotaciona o refresh token (invalida o antigo, emite novo).
 */
const refresh = async (req, res) => {
  const token = req.cookies?.[refreshTokenName];

  // Lança AppError para manter o padrão de erro centralizado (BUG-05)
  if (!token) throw new UnauthorizedError("Refresh token ausente.");

  const { accessToken, refreshToken } = await authService.refresh(token, req.ip);

  res.cookie(refreshTokenName, refreshToken, COOKIE_OPTS);
  res.json({ accessToken });
};

/**
 * POST /auth/logout
 * Revoga o refresh token do dispositivo atual.
 */
const logout = async (req, res) => {
  const token = req.cookies?.[refreshTokenName];

  if (token) {
    await authService.logout(token, req.user.id, req.ip);
  }

  res.clearCookie(refreshTokenName);
  res.json({ message: "Logout realizado com sucesso." });
};

/**
 * POST /auth/logout-all
 * Revoga todos os refresh tokens do usuário (todos os dispositivos).
 */
const logoutAll = async (req, res) => {
  await authService.logoutAll(req.user.id, req.ip);
  res.clearCookie(refreshTokenName);
  res.json({ message: "Todos os dispositivos desconectados." });
};

module.exports = { login, refresh, logout, logoutAll };
