/**
 * src/lib/prisma.js
 *
 * Singleton do PrismaClient.
 * Uma única instância compartilhada por toda a aplicação evita
 * esgotamento de conexões com o banco em ambientes de desenvolvimento
 * com hot-reload.
 */

// src/lib/prisma.js
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const config = require("../config");

// Cria o adapter com a string de conexão do .env
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Passa o adapter para o PrismaClient
const prisma = new PrismaClient({
  adapter,
  log: config.app.isDev ? ["warn", "error"] : ["error"],
});

module.exports = prisma;
