/**
 * src/controllers/userController.js
 *
 * Camada HTTP para gerenciamento de usuários.
 * Responsabilidade: parsear req, validar input, delegar ao service, escrever res.
 *
 * Correções aplicadas:
 *   SEC-05 — parseId valida e rejeita IDs não-numéricos antes de chegar ao service
 *   ORG-01 — usa parseBody compartilhado
 *   ORG-02 — requesterCtx extraído como helper local claro
 */

const userService = require("../services/userService");
const { createUserSchema, updateUserSchema } = require("../validators/userValidator");
const { parseBody }   = require("../lib/parseBody");
const config          = require("../config");
const { ValidationError } = require("../errors/AppError");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Converte e valida o parâmetro de rota :id.
 * Lança ValidationError para valores não-numéricos ou negativos.
 * @param {string} raw
 * @returns {number}
 */
const parseId = (raw) => {
  const id = parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) {
    throw new ValidationError("Parâmetro 'id' deve ser um número inteiro positivo.");
  }
  return id;
};

/**
 * Extrai o contexto do requisitante a partir do token JWT decodificado.
 * req.user é populado pelo middleware authenticate.
 * @param {import("express").Request} req
 * @returns {{ requesterId: number, requesterRole: string }}
 */
const requesterCtx = (req) => ({
  requesterId:   req.user.id,
  requesterRole: req.user.role,
});

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * GET /users?page=1&limit=20
 * Lista usuários com paginação. Restrito a ADMINs.
 */
const listUsers = async (req, res) => {
  const page  = Math.max(config.pagination.defaultPage,
                  parseInt(req.query.page, 10) || config.pagination.defaultPage);
  const limit = Math.min(config.pagination.maxLimit,
                  Math.max(1, parseInt(req.query.limit, 10) || config.pagination.defaultLimit));

  const result = await userService.listUsers({ page, limit, ...requesterCtx(req) });

  res.json({
    data: result.users,
    meta: {
      total: result.total,
      page:  result.page,
      limit: result.limit,
      pages: Math.ceil(result.total / result.limit),
    },
  });
};

/**
 * GET /users/:id
 * Retorna um usuário. ADMINs veem qualquer um; USERs só o próprio perfil.
 */
const getUser = async (req, res) => {
  const id   = parseId(req.params.id);
  const user = await userService.getUserById(id, requesterCtx(req));
  res.json({ data: user });
};

/**
 * POST /users
 * Cria um novo usuário.
 */
const createUser = async (req, res) => {
  const data = parseBody(createUserSchema, req.body);
  const user = await userService.createUser(data, requesterCtx(req));
  res.status(201).json({ message: "Usuário criado com sucesso.", data: user });
};

/**
 * PUT /users/:id
 * Atualiza campos de um usuário.
 */
const updateUser = async (req, res) => {
  const id   = parseId(req.params.id);
  const data = parseBody(updateUserSchema, req.body);
  const user = await userService.updateUser(id, data, requesterCtx(req));
  res.json({ message: "Usuário atualizado.", data: user });
};

/**
 * DELETE /users/:id
 * Desativa (soft-delete) um usuário.
 */
const deleteUser = async (req, res) => {
  const id = parseId(req.params.id);
  await userService.deleteUser(id, requesterCtx(req));
  res.json({ message: "Usuário removido com sucesso." });
};

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
