const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Middlewares Globais de Segurança e Parsing
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Previne ataques de payload gigante

// Rotas da Aplicação
app.use('/api/users', userRoutes);

// Tratamento de rotas inexistentes (404 Global)
// Sem string de rota: intercepta absolutamente tudo o que sobrou com 100% de compatibilidade
app.use((req, res, next) => {
  next(new AppError(`A rota ${req.originalUrl} não foi encontrada neste servidor.`, 404));
});

// Tratamento de Erros Global
app.use(errorHandler);

module.exports = app;