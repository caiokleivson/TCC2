/**
 * src/validators/userValidator.js
 *
 * Schemas Zod para criação e atualização de usuários.
 * Validações de formato, tamanho e conteúdo centralizadas aqui.
 * A lógica de negócio (unicidade de e-mail, permissão de role) fica no service.
 */

const { z } = require("zod");

const roleEnum = z.enum(["USER", "ADMIN"], {
  errorMap: () => ({ message: "Role deve ser 'USER' ou 'ADMIN'." }),
});

/**
 * Schema para POST /users.
 * Todos os campos obrigatórios; senha com regras de força mínima.
 */
const createUserSchema = z.object({
  name: z
    .string({ required_error: "'name' é obrigatório." })
    .trim()
    .min(2,   "'name' deve ter ao menos 2 caracteres.")
    .max(100, "'name' deve ter no máximo 100 caracteres."),

  email: z
    .string({ required_error: "'email' é obrigatório." })
    .trim()
    .toLowerCase()
    .email("'email' inválido.")
    .max(254, "'email' muito longo."),

  password: z
    .string({ required_error: "'password' é obrigatório." })
    .min(8,  "'password' deve ter ao menos 8 caracteres.")
    .max(72, "'password' deve ter no máximo 72 caracteres.")  // limite do bcrypt
    .regex(/[A-Z]/, "'password' deve conter ao menos uma letra maiúscula.")
    .regex(/[0-9]/, "'password' deve conter ao menos um número."),

  role: roleEnum.optional(),
});

/**
 * Schema para PUT /users/:id.
 * Todos os campos opcionais, mas pelo menos um deve ser enviado.
 * Alteração de senha não permitida aqui — endpoint dedicado futuro.
 */
const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2,   "'name' deve ter ao menos 2 caracteres.")
      .max(100, "'name' deve ter no máximo 100 caracteres.")
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("'email' inválido.")
      .max(254, "'email' muito longo.")
      .optional(),

    role: roleEnum.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Informe ao menos um campo para atualizar." }
  );

module.exports = { createUserSchema, updateUserSchema };
