function notFoundMiddleware(req, res) {
  return res.status(404).json({
    error: "Rota não encontrada."
  });
}

module.exports = notFoundMiddleware;