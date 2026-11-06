const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const env = require('./env');

const prismaClientSingleton = () => {
  // Cria a poool de conexão nativa do PostgreSQL
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  
  // Cria o adaptador exigido pelo Prisma v7
  const adapter = new PrismaPg(pool);
  
  // Instancia o cliente passando o adaptador de conexão direta
  return new PrismaClient({ adapter });
};

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

module.exports = prisma;