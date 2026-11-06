/**
 * src/services/userService.js
 *
 * Lógica de negócio para gerenciamento de usuários.
 * Aplica regras de autorização (BOLA e RBAC) antes de qualquer operação.
 *
 * Correções aplicadas:
 *   BUG-01 — removido lookup duplo / dead code em createUser
 *   MAN-02 — usa constantes AuditAction
 *
 * @typedef {{ requesterId: number, requesterRole: string }} RequesterContext
 */

const userRepo   = require("../repositories/userRepository");
const auditRepo  = require("../repositories/auditRepository");
const password   = require("../lib/password");
const { AuditAction } = require("../constants/auditActions");
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} = require("../errors/AppError");

/**
 * Garante que o usuário existe e está ativo.
 * Lança NotFoundError caso contrário.
 * @param {number} id
 */
const assertExists = async (id) => {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError("Usuário");
  return user;
};

/**
 * Lista usuários ativos com paginação.
 * Restrito a ADMINs (OWASP API5).
 *
 * @param {{ page: number, limit: number } & RequesterContext} params
 */
const listUsers = async ({ page, limit, requesterId, requesterRole }) => {
  if (requesterRole !== "ADMIN") throw new ForbiddenError();

  await auditRepo.log({ userId: requesterId, action: AuditAction.USER_LIST });

  return userRepo.findAll({ page, limit });
};

/**
 * Busca usuário por ID.
 * USERs só podem ver seu próprio perfil; ADMINs veem qualquer um (OWASP API1).
 *
 * @param {number} targetId
 * @param {RequesterContext} ctx
 */
const getUserById = async (targetId, { requesterId, requesterRole }) => {
  // BOLA check — verifica ANTES de consultar o banco
  if (requesterRole !== "ADMIN" && requesterId !== targetId) {
    throw new ForbiddenError();
  }

  const user = await userRepo.findById(targetId);
  if (!user) throw new NotFoundError("Usuário");

  return user;
};

/**
 * Cria um novo usuário.
 * Apenas ADMINs podem definir roles diferentes de USER (OWASP API5).
 *
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @param {RequesterContext} ctx
 */
const createUser = async (data, { requesterId, requesterRole }) => {
  // Verifica unicidade do e-mail (único lookup necessário — BUG-01 corrigido)
  const duplicate = await userRepo.findByEmail(data.email);
  if (duplicate) throw new ConflictError("E-mail já está em uso.");

  // Impede escalonamento de privilégio
  if (data.role && data.role !== "USER" && requesterRole !== "ADMIN") {
    throw new ForbiddenError("Somente administradores podem definir roles.");
  }

  const passwordHash = await password.hash(data.password);
  const assignedRole = requesterRole === "ADMIN" ? (data.role ?? "USER") : "USER";

  const user = await userRepo.create({
    name:  data.name,
    email: data.email,
    passwordHash,
    role:  assignedRole,
  });

  await auditRepo.log({
    userId:     requesterId,
    action:     AuditAction.USER_CREATED,
    targetId:   user.id,
    targetType: "User",
  });

  return user;
};

/**
 * Atualiza dados de um usuário.
 * USERs só atualizam a si mesmos; somente ADMINs alteram roles (OWASP API1, API5).
 *
 * @param {number} targetId
 * @param {{ name?: string, email?: string, role?: string }} data
 * @param {RequesterContext} ctx
 */
const updateUser = async (targetId, data, { requesterId, requesterRole }) => {
  await assertExists(targetId);

  // BOLA check
  if (requesterRole !== "ADMIN" && requesterId !== targetId) {
    throw new ForbiddenError();
  }

  // Impede escalonamento de privilégio
  if (data.role !== undefined && requesterRole !== "ADMIN") {
    throw new ForbiddenError("Somente administradores podem alterar roles.");
  }

  // Verifica unicidade do novo e-mail
  if (data.email) {
    const conflict = await userRepo.findByEmail(data.email);
    if (conflict && conflict.id !== targetId) {
      throw new ConflictError("E-mail já está em uso por outro usuário.");
    }
  }

  const updated = await userRepo.update(targetId, data);

  await auditRepo.log({
    userId:     requesterId,
    action:     AuditAction.USER_UPDATED,
    targetId,
    targetType: "User",
    meta:       { fields: Object.keys(data) },
  });

  return updated;
};

/**
 * Desativa (soft-delete) um usuário.
 * USERs só removem a si mesmos; ADMINs não podem se auto-remover (OWASP API1).
 *
 * @param {number} targetId
 * @param {RequesterContext} ctx
 */
const deleteUser = async (targetId, { requesterId, requesterRole }) => {
  await assertExists(targetId);

  if (requesterRole !== "ADMIN" && requesterId !== targetId) {
    throw new ForbiddenError();
  }

  if (requesterRole === "ADMIN" && requesterId === targetId) {
    throw new ForbiddenError("Administrador não pode desativar a própria conta.");
  }

  await userRepo.softDelete(targetId);

  await auditRepo.log({
    userId:     requesterId,
    action:     AuditAction.USER_DELETED,
    targetId,
    targetType: "User",
  });
};

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
