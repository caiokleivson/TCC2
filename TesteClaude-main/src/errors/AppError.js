/**
 * src/errors/AppError.js
 *
 * Hierarquia de erros de aplicação.
 * O errorHandler global distingue AppError de erros inesperados,
 * garantindo respostas controladas sem vazar internals (OWASP API7).
 */

class AppError extends Error {
  /**
   * @param {string} message     Mensagem para o cliente
   * @param {number} statusCode  HTTP status code
   * @param {string} code        Código de erro interno (ex: "NOT_FOUND")
   */
  constructor(message, statusCode = 400, code = "APP_ERROR") {
    super(message);
    this.name       = "AppError";
    this.statusCode = statusCode;
    this.code       = code;
  }
}

/** Recurso não encontrado — 404 */
class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} não encontrado(a).`, 404, "NOT_FOUND");
  }
}

/** Conflito de dados — 409 */
class ConflictError extends AppError {
  constructor(message = "Recurso já existe.") {
    super(message, 409, "CONFLICT");
  }
}

/** Erro de validação de entrada — 422 */
class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {{ field: string, message: string }[]} details
   */
  constructor(message, details = []) {
    super(message, 422, "VALIDATION_ERROR");
    this.details = details;
  }
}

/**
 * Não autenticado — 401
 * Mensagem genérica proposital: não revela se o usuário existe (OWASP API2).
 */
class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/** Autorização insuficiente — 403 (OWASP API5) */
class ForbiddenError extends AppError {
  constructor(message = "Acesso negado.") {
    super(message, 403, "FORBIDDEN");
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
};
