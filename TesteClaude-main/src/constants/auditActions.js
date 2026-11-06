/**
 * src/constants/auditActions.js
 *
 * Constantes para os action strings do AuditLog.
 * Elimina strings mágicas dispersas e previne typos silenciosos.
 *
 * Correção: MAN-02
 */

const AuditAction = Object.freeze({
  // Autenticação
  LOGIN_SUCCESS:        "LOGIN_SUCCESS",
  LOGIN_FAILED:         "LOGIN_FAILED",
  LOGOUT:               "LOGOUT",
  LOGOUT_ALL:           "LOGOUT_ALL",
  REFRESH_TOKEN_REUSE:  "REFRESH_TOKEN_REUSE",

  // Usuários
  USER_LIST:    "USER_LIST",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
});

module.exports = { AuditAction };
