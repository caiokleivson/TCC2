/**
 * src/middlewares/requestLogger.js
 *
 * Log de cada requisição: método, path, status e latência.
 * Nunca registra o body (pode conter senhas ou PII).
 *
 * Correção MAN-04: o timestamp é capturado no início da requisição,
 * não no evento "finish" (que pode ser alguns ms posterior).
 *
 * OWASP API9 — logging e monitoramento adequados.
 */

const requestLogger = (req, res, next) => {
  const startMs        = Date.now();
  const startTimestamp = new Date().toISOString(); // capturado no início

  res.on("finish", () => {
    const duration = Date.now() - startMs;
    const status   = res.statusCode;
    const level    = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
    const userId   = req.user?.id ?? "-";

    console.log(
      `[${level}] ${startTimestamp} ${req.method} ${req.originalUrl}` +
      ` → ${status} (${duration}ms) user=${userId} ip=${req.ip}`
    );
  });

  next();
};

module.exports = requestLogger;
