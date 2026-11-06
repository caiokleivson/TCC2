const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  // Log no servidor apenas se o erro não for operacional
  if (!err.isOperational) console.error('🔥 ERROR START 🔥\n', err, '\n🔥 ERROR END 🔥');

  const statusCode = err.statusCode || 500;
  
  // Oculta detalhes do erro interno para o cliente
  const message = err.isOperational 
    ? err.message 
    : 'Ocorreu um erro interno no servidor.';

  res.status(statusCode).json({
    status: 'error',
    message,
    // Envia a stack trace apenas em ambiente de desenvolvimento
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;