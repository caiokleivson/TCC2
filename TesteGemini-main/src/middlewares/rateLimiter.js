const rateLimit = require('express-rate-limit');

// Limite Global: 100 requisições a cada 15 minutos
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: 'Muitas requisições originadas deste IP, tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite Estrito para Login: 5 tentativas a cada 15 minutos
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: 'Muitas tentativas de login. Conta temporariamente bloqueada. Tente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter };