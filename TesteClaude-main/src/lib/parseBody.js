/**
 * src/lib/parseBody.js
 *
 * Helper compartilhado de validação de input com Zod.
 * Elimina a duplicação de parseBody em authController e userController.
 *
 * Correção: ORG-01
 */

const { ValidationError } = require("../errors/AppError");

/**
 * Valida `body` contra um schema Zod.
 * Lança ValidationError com detalhes formatados em caso de falha.
 *
 * @template T
 * @param {import("zod").ZodType<T>} schema
 * @param {unknown} body
 * @returns {T}
 */
const parseBody = (schema, body) => {
  const result = schema.safeParse(body);

  if (!result.success) {
    const details = (result.error.errors || []).map((e) => ({
      field:   e.path.join(".") || "body",
      message: e.message,
    }));
    throw new ValidationError("Dados de entrada inválidos.", details);
  }

  return result.data;
};

module.exports = { parseBody };
