function errorMiddleware(error, req, res, next) {
  console.error(error.message);

  return res.status(error.statusCode || 500).json({
    error: error.message || "Erro interno."
  });
}

module.exports = errorMiddleware;