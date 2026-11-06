const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('Acesso negado. Token não fornecido.', 401));
  }

  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch (error) {
    return next(new AppError('Token inválido ou expirado.', 401));
  }
};

const authorizeUserOwner = (req, res, next) => {
  const resourceId = parseInt(req.params.id, 10);
  
  if (req.user.userId !== resourceId) {
    return next(new AppError('Acesso negado. Você não tem permissão para modificar ou visualizar este recurso.', 403));
  }
  
  next();
};

module.exports = { authenticateToken, authorizeUserOwner };