/**
 * src/app.js
 *
 * Configuração do Express: middlewares globais, rotas, tratamento de erros.
 * Sem lógica de negócio — apenas pipeline de request/response.
 */

const express        = require("express");
const helmet         = require("helmet");
const cookieParser   = require("cookie-parser");
const config         = require("./config");
const routes         = require("./routes");
const requestLogger  = require("./middlewares/requestLogger");
const errorHandler   = require("./middlewares/errorHandler");
const { apiLimiter } = require("./middlewares/rateLimiter");

const app = express();

// ── Headers de segurança (OWASP API7) ─────────────────────────────────────────
// Helmet configura: Content-Security-Policy, X-Frame-Options,
// Strict-Transport-Security, X-Content-Type-Options, e outros.
app.use(helmet());
app.disable("x-powered-by");

// Confia no primeiro proxy reverso (Nginx / load balancer) para obter req.ip real
app.set("trust proxy", 1);

// ── Parsing de request ─────────────────────────────────────────────────────────
// Limita payload a 10kb — mitiga ataques de payload gigante (OWASP API4)
app.use(express.json({ limit: config.payload.maxSize }));
app.use(express.urlencoded({ extended: false, limit: config.payload.maxSize }));
app.use(cookieParser());

// ── Logging de requisições ─────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate limiting global (OWASP API4) ─────────────────────────────────────────
app.use(apiLimiter);

// ── Health-check público ───────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    version:   config.app.version,
  })
);

// ── Rotas da API ───────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

// ── 404 — rota não encontrada ──────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: "Rota não encontrada.", code: "NOT_FOUND" })
);

// ── Error handler global (deve ser o último middleware) ────────────────────────
app.use(errorHandler);

module.exports = app;
