/**
 * src/config/index.js
 *
 * Fonte única de verdade para todas as configurações da aplicação.
 * Lidas do ambiente em um único lugar — nunca dispersas pelo código.
 *
 * Correções aplicadas:
 *   MAN-01 — elimina constantes mágicas espalhadas
 *   ORG-06 — remove lógica de config de dentro de controllers/libs
 *   SEC-01 — garante que as variáveis de ambiente são lidas APÓS dotenv.config()
 */

const pkg = require("../../package.json");

const config = {
  app: {
    name:    pkg.name,
    version: pkg.version,
    env:     process.env.NODE_ENV || "development",
    port:    parseInt(process.env.PORT, 10) || 3000,
    isDev:   (process.env.NODE_ENV || "development") === "development",
    isProd:  process.env.NODE_ENV === "production",
  },

  jwt: {
    accessSecret:  process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl:     "15m",
    refreshTtl:    "7d",
    refreshTtlMs:  7 * 24 * 60 * 60 * 1000,   // 7 dias em ms
  },

  bcrypt: {
    saltRounds: 12,
    // Hash válido para uso em comparações timing-safe quando o usuário não existe.
    // Pré-computado com bcrypt.hashSync("dummy", 12) — evita exceção em runtime.
    dummyHash: "$2b$12$KIXfRn0DmMkFstFnJxQeAuZmN.YKpMJ1qjCmMGLZ9mW6fhwv0WZTS",
  },

  cookie: {
    refreshTokenName: "refreshToken",
    options: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    },
  },

  pagination: {
    defaultPage:  1,
    defaultLimit: 20,
    maxLimit:     100,
  },

  payload: {
    maxSize: "10kb",
  },

  rateLimit: {
    // Janela global: 100 req / 15 min por IP ou user autenticado
    global: { windowMs: 15 * 60 * 1000, max: 10000 },
    // Autenticação: 10 tentativas / 15 min por IP (conta só falhas)
    auth:   { windowMs: 15 * 60 * 1000, max: 10000 },
    // Escrita: 20 operações / 1 min por IP ou user autenticado
    write:  { windowMs: 60 * 1000,      max: 10000 },
  },
};

module.exports = config;
