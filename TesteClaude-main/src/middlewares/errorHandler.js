/**
 * src/middlewares/errorHandler.js
 *
 * Handler global de erros — último middleware registrado no app.js.
 * Garante respostas controladas sem vazar stack traces ou internals em produção.
 *
 * OWASP API7 — security misconfiguration / information disclosure.
 */

const config = require("../config");
const { AppError, ValidationError } = require("../errors/AppError");

/**
 * @param {Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next  Obrigatório ter 4 parâmetros para o Express reconhecer como error handler
 */
const errorHandler = (err, req, res, _next) => {
  // Log interno completo — stack trace, causa, metadados do Prisma, etc.
  console.error(
    `[ERROR] ${req.method} ${req.url} user=${req.user?.id ?? "-"}`,
    err
  );

  // ── Erros de negócio conhecidos ────────────────────────────────────────────
  if (err instanceof AppError) {
    const body = { error: err.message, code: err.code };

    if (err instanceof ValidationError && err.details?.length) {
      body.details = err.details;
    }

    return res.status(err.statusCode).json(body);
  }

  // ── Erros do Prisma ────────────────────────────────────────────────────────

  // P2002 — violação de constraint unique
  if (err.code === "P2002") {
    return res.status(409).json({ error: "Dado duplicado.", code: "CONFLICT" });
  }

  // P2025 — registro não encontrado em update/delete
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado.", code: "NOT_FOUND" });
  }

  // ── Erros inesperados ──────────────────────────────────────────────────────
  // Em produção: nunca expor stack trace ou mensagem interna.
  res.status(500).json({
    error: "Erro interno do servidor.",
    code:  "INTERNAL_ERROR",
    ...(config.app.isDev ? { detail: err.message } : {}),
  });
};

module.exports = errorHandler;
