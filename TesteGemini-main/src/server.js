const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Servidor rodando no modo ${env.NODE_ENV} na porta ${env.PORT}`);
});

// Desligamento Gracioso (Graceful Shutdown)
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Recebido ${signal}. Desligando graciosamente...`);
  
  server.close(async () => {
    console.log('HTTP server fechado.');
    await prisma.$disconnect();
    console.log('Conexão com Banco de Dados encerrada.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));