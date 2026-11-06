const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // Faz a parse e aplica modificadores como .trim() e .toLowerCase()
    next();
  } catch (error) {
    const messages = error.errors.map(err => `${err.path[0]}: ${err.message}`).join(', ');
    next(new AppError(`Erro de validação: ${messages}`, 400));
  }
};

module.exports = validate;