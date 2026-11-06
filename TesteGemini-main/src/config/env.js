require('dotenv').config();

const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Fail-Fast: Impede a inicialização insegura da API
if (!env.DATABASE_URL) throw new Error('❌ DATABASE_URL não definida no .env');
if (!env.JWT_SECRET) throw new Error('❌ JWT_SECRET não definida no .env');

module.exports = env;