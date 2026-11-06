/**
 * src/repositories/auditRepository.js
 *
 * Acesso ao banco para registros de auditoria.
 * Falhas de auditoria nunca devem derrubar a operação principal,
 * mas o erro completo é logado para visibilidade (OWASP API9).
 *
 * Correção ORG-04: preserva stack trace no log de falha.
 * Correção MAN-02: usa constantes de AuditAction (importadas pelo caller).
 *
 * @typedef {Object} AuditEntry
 * @property {number|null}  [userId]
 * @property {string}       action
 * @property {number|null}  [targetId]
 * @property {string|null}  [targetType]
 * @property {object|null}  [meta]
 * @property {string|null}  [ip]
 */

const prisma = require("../lib/prisma");

/**
 * Registra uma entrada de auditoria de forma não-bloqueante.
 * Nunca lança exceção — absorve falhas com log completo.
 * @param {AuditEntry} entry
 * @returns {Promise<void>}
 */
const log = async (entry) => {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (err) {
    // Loga stack trace completo para depuração, sem propagar o erro
    console.error("[AUDIT] Falha ao registrar entrada de auditoria:", err);
  }
};

module.exports = { log };
