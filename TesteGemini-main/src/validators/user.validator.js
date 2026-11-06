const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').trim(),
  email: z.string().email('Formato de email inválido.').trim().toLowerCase(),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.')
});

const loginSchema = z.object({
  email: z.string().email('Formato de email inválido.').trim().toLowerCase(),
  password: z.string().min(1, 'A senha é obrigatória.')
});

const updateUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').trim().optional(),
  email: z.string().email('Formato de email inválido.').trim().toLowerCase().optional(),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Pelo menos um campo deve ser fornecido para atualização."
});

module.exports = { createUserSchema, loginSchema, updateUserSchema };