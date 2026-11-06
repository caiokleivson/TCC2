/**
 * src/repositories/refreshTokenRepository.js
 *
 * Acesso ao banco para refresh tokens.
 * Tokens armazenados como hash SHA-256 — nunca o valor bruto (OWASP API2).
 *
 * Correções aplicadas:
 *   SEC-02 — revoke agora retorna contagem e o caller pode checar o resultado
 *   SEC-03 — findValid usa select explícito em vez de include, evitando
 *             retornar passwordHash do usuário na memória do service
 */

const prisma = require("../lib/prisma");
const crypto = require("crypto");

/**
 * Gera o hash SHA-256 de um token.
 * @param {string} token
 * @returns {string}
 */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Campos do usuário retornados junto ao refresh token.
 * passwordHash explicitamente excluído (SEC-03).
 */
const USER_SELECT = {
  id:       true,
  email:    true,
  role:     true,
  isActive: true,
  name:     true,
};

/**
 * Cria um novo registro de refresh token.
 * @param {number}   userId
 * @param {string}   token      Valor bruto (será hasheado aqui)
 * @param {Date}     expiresAt
 */
const create = (userId, token, expiresAt) =>
  prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

/**
 * Busca um refresh token válido (não revogado e não expirado).
 * Retorna o registro junto ao usuário (sem passwordHash).
 * @param {string} token  Valor bruto do token
 * @returns {Promise<{ id: string, userId: number, user: object } | null>}
 */
const findValid = (token) =>
  prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id:        true,
      userId:    true,
      expiresAt: true,
      user:      { select: USER_SELECT },
    },
  });

/**
 * Revoga um token específico pelo seu valor bruto.
 * Retorna a contagem de registros afetados.
 * @param {string} token
 * @returns {Promise<number>}
 */
const revoke = async (token) => {
  const result = await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data:  { revokedAt: new Date() },
  });
  return result.count;
};

/**
 * Revoga todos os refresh tokens ativos de um usuário.
 * Usado em logout-all e em resposta a detecção de reuso.
 * @param {number} userId
 * @returns {Promise<number>}
 */
const revokeAllForUser = async (userId) => {
  const result = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data:  { revokedAt: new Date() },
  });
  return result.count;
};

/**
 * Remove tokens expirados do banco.
 * Deve ser chamado periodicamente para evitar crescimento indefinido da tabela.
 * @returns {Promise<number>} Quantidade de registros removidos
 */
const deleteExpired = async () => {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
};

module.exports = { create, findValid, revoke, revokeAllForUser, deleteExpired };
