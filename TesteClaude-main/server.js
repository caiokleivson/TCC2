/**
 * server.js
 *
 * Ponto de entrada da aplicação.
 * Responsabilidades: carregar env, validar configuração, iniciar servidor,
 * agendar tarefas de manutenção e gerenciar ciclo de vida do processo.
 *
 * Correções aplicadas:
 *   BUG-06 — dotenv.config() executado ANTES de qualquer import que leia process.env
 *   ORG-05 — lógica de validação, startup e shutdown separada em funções nomeadas
 *   ESC-02 — cleanup agendado de refresh tokens expirados (a cada 24 horas)
 */

// dotenv DEVE ser o primeiro require — libs importadas depois lerão process.env correto
require("dotenv").config();

const app    = require("./src/app");
const prisma = require("./src/lib/prisma");
const config = require("./src/config");
const refreshTokenRepo = require("./src/repositories/refreshTokenRepository");

// ── Variáveis obrigatórias ─────────────────────────────────────────────────────

const REQUIRED_ENV = ["DATABASE_URL", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

/**
 * Valida que todas as variáveis de ambiente obrigatórias estão presentes.
 * Encerra o processo imediatamente em caso de ausência — falha rápida e visível.
 */
const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[FATAL] Variáveis de ambiente ausentes: ${missing.join(", ")}`);
    console.error("        Verifique seu arquivo .env e tente novamente.");
    process.exit(1);
  }
};

// ── Startup ────────────────────────────────────────────────────────────────────

/**
 * Inicia o servidor HTTP e registra as tarefas de manutenção.
 */
const start = () => {
  const server = app.listen(config.app.port, () => {
    console.log(`\n🔒 ${config.app.name} v${config.app.version}`);
    console.log(`   Ambiente : ${config.app.env}`);
    console.log(`   Servidor : http://localhost:${config.app.port}`);
    console.log(`   API Base : http://localhost:${config.app.port}/api/v1\n`);
  });

  // Agenda limpeza de refresh tokens expirados a cada 24 horas (ESC-02)
  scheduleTokenCleanup();

  return server;
};

// ── Manutenção ─────────────────────────────────────────────────────────────────

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Remove periodicamente refresh tokens expirados do banco.
 * Previne crescimento indefinido da tabela refresh_tokens.
 */
const scheduleTokenCleanup = () => {
  const run = async () => {
    try {
      const count = await refreshTokenRepo.deleteExpired();
      if (count > 0) {
        console.log(`[CLEANUP] ${count} refresh token(s) expirado(s) removido(s).`);
      }
    } catch (err) {
      console.error("[CLEANUP] Erro ao limpar tokens expirados:", err.message);
    }
  };

  // Executa uma vez imediatamente e depois a cada intervalo
  run();
  setInterval(run, CLEANUP_INTERVAL_MS);
};

// ── Graceful Shutdown ──────────────────────────────────────────────────────────

/**
 * Encerra o servidor de forma controlada:
 * para de aceitar novas conexões, fecha as existentes e desconecta do banco.
 *
 * @param {import("http").Server} server
 * @param {string} signal  Nome do sinal recebido (SIGTERM, SIGINT)
 */
const shutdown = (server, signal) => async () => {
  console.log(`\n[${signal}] Sinal recebido. Encerrando servidor...`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("✅ Conexão com o banco encerrada. Até logo!\n");
      process.exit(0);
    } catch (err) {
      console.error("Erro ao desconectar do banco:", err);
      process.exit(1);
    }
  });

  // Força encerramento após 10 segundos se houver conexões travadas
  setTimeout(() => {
    console.error("[SHUTDOWN] Timeout atingido. Forçando encerramento.");
    process.exit(1);
  }, 10_000).unref();
};

// ── Erros não tratados ─────────────────────────────────────────────────────────

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
  // Não encerra o processo — apenas loga. Em produção, considere alertar o time.
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException] Erro fatal:", err);
  process.exit(1);
});

// ── Boot ───────────────────────────────────────────────────────────────────────

validateEnv();

const server = start();

process.on("SIGTERM", shutdown(server, "SIGTERM"));
process.on("SIGINT",  shutdown(server, "SIGINT"));
