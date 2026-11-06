/**
 * src/validators/authValidator.js
 *
 * Schema Zod para a rota de login.
 * Validação mínima intencional: mensagens de erro de login são genéricas
 * para não revelar se o e-mail existe (OWASP API2).
 */

const { z } = require("zod");

const loginSchema = z.object({
  email: z
    .string({ required_error: "'email' é obrigatório." })
    .email("Credenciais inválidas."),

  password: z
    .string({ required_error: "'password' é obrigatório." })
    .min(1, "Credenciais inválidas."),
});

module.exports = { loginSchema };
