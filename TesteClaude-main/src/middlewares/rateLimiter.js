/**
 * src/middlewares/rateLimiter.js
 *
 * Proteção contra DoS e força bruta via rate limiting por camada.
 * Configurações centralizadas no config/index.js (MAN-01).
 *
 * OWASP API4 — consumo irrestrito de recursos.
 *
 * Nota ESC-01: o store padrão (in-memory) não é compartilhado entre múltiplos
 * processos/instâncias. Para escalar horizontalmente, substitua por um store
 * Redis usando o pacote `rate-limit-redis`:
 *
 *   const RedisStore = require("rate-limit-redis");
 *   store: new RedisStore({ sendCommand: (...args) => redis.sendCommand(args) })
 */

const rateLimit = require("express-rate-limit");
const config    = require("../config");

/**
 * Gera a chave de identificação para o rate limiter.
 * Usa o ID do usuário autenticado quando disponível; caso contrário, o IP.
 * Isso evita penalizar todos os usuários por trás do mesmo NAT/proxy.
 *
 * @param {import("express").Request} req
 * @returns {string}
 */
const keyGenerator = (req) =>
  req.user ? `user:${req.user.id}` : `ip:${req.ip}`;

/** Limiter global: 100 requisições por 15 minutos. */
const apiLimiter = rateLimit({
  windowMs:        config.rateLimit.global.windowMs,
  max:             config.rateLimit.global.max,
  standardHeaders: "draft-7",
  legacyHeaders:   false,
  keyGenerator,
  message: {
    error: "Muitas requisições. Tente novamente em alguns minutos.",
    code:  "RATE_LIMITED",
  },
});

/**
 * Limiter de autenticação: 10 tentativas por 15 minutos por IP.
 * Conta apenas requisições com falha (skipSuccessfulRequests: true).
 */
const authLimiter = rateLimit({
  windowMs:               config.rateLimit.auth.windowMs,
  max:                    config.rateLimit.auth.max,
  standardHeaders:        "draft-7",
  legacyHeaders:          false,
  keyGenerator:           (req) => `ip:${req.ip}`,
  skipSuccessfulRequests: true,
  message: {
    error: "Muitas tentativas de autenticação. Aguarde 15 minutos.",
    code:  "RATE_LIMITED",
  },
});

/** Limiter de escrita: 20 operações por minuto. */
const writeLimiter = rateLimit({
  windowMs:        config.rateLimit.write.windowMs,
  max:             config.rateLimit.write.max,
  standardHeaders: "draft-7",
  legacyHeaders:   false,
  keyGenerator,
  message: {
    error: "Limite de operações de escrita atingido. Tente novamente em breve.",
    code:  "RATE_LIMITED",
  },
});

module.exports = { apiLimiter, authLimiter, writeLimiter };
