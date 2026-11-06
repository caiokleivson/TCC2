// prisma.config.js
//
// Arquivo de configuração do Prisma 7 (obrigatório nesta versão).
// No Prisma 7, a URL de conexão foi removida do schema.prisma e deve ser
// fornecida aqui via prisma.config.ts/.js.
//
// Referência: https://www.prisma.io/docs/orm/reference/prisma-config-reference

require("dotenv").config();
const { defineConfig, env } = require("prisma/config");
const { PrismaPg } = require("@prisma/adapter-pg");

module.exports = defineConfig({
  // Caminho para o arquivo de schema
  schema: "prisma/schema.prisma",

  // Configuração do banco de dados — lê DATABASE_URL do .env
 datasource: {
    // A URL ainda é lida do .env, mas agora usada pelo adapter
    url: env("DATABASE_URL"),
    // Adapter obrigatório para PostgreSQL
    adapter: new PrismaPg({
      connectionString: env("DATABASE_URL"),
    }),
  },

  // Diretório onde as migrations são geradas/armazenadas
  migrations: {
    path: "prisma/migrations",
  },
});
