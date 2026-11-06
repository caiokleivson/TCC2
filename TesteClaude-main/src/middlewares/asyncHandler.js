/**
 * src/middlewares/asyncHandler.js
 *
 * Envolve handlers async e encaminha quaisquer erros para o errorHandler global.
 * Elimina a necessidade de try/catch em cada controller.
 *
 * @param {import("express").RequestHandler} fn  Handler async
 * @returns {import("express").RequestHandler}
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
