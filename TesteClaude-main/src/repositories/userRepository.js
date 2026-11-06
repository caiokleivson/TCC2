/**
 * src/repositories/userRepository.js
 *
 * Acesso ao banco para a entidade User.
 * Toda interação com o Prisma fica aqui — services não importam o PrismaClient.
 *
 * Campos retornados nunca incluem passwordHash (select explícito em PUBLIC_FIELDS).
 * Versões "WithPassword" existem apenas para uso interno de autenticação (OWASP API3).
 *
 * @typedef {Object} PublicUser
 * @property {number}  id
 * @property {string}  name
 * @property {string}  email
 * @property {string}  role
 * @property {boolean} isActive
 * @property {Date}    createdAt
 * @property {Date}    updatedAt
 */

const prisma = require("../lib/prisma");

/** Projeção pública: exclui passwordHash de todas as respostas para clientes. */
const PUBLIC_FIELDS = {
  id:        true,
  name:      true,
  email:     true,
  role:      true,
  isActive:  true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Lista usuários ativos com paginação.
 * @param {{ page?: number, limit?: number }} options
 * @returns {Promise<{ users: PublicUser[], total: number, page: number, limit: number }>}
 */
const findAll = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where:   { isActive: true },
      select:  PUBLIC_FIELDS,
      skip,
      take:    limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  return { users, total, page, limit };
};

/**
 * Busca usuário por ID (sem passwordHash).
 * @param {number} id
 * @returns {Promise<PublicUser | null>}
 */
const findById = (id) =>
  prisma.user.findUnique({ where: { id }, select: PUBLIC_FIELDS });

/**
 * Busca usuário por ID incluindo passwordHash.
 * Uso exclusivo da camada de autenticação.
 * @param {number} id
 * @returns {Promise<object | null>}
 */
const findByIdWithPassword = (id) =>
  prisma.user.findUnique({ where: { id } });

/**
 * Busca usuário por e-mail (sem passwordHash).
 * @param {string} email
 * @returns {Promise<PublicUser | null>}
 */
const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email }, select: PUBLIC_FIELDS });

/**
 * Busca usuário por e-mail incluindo passwordHash.
 * Uso exclusivo da camada de autenticação.
 * @param {string} email
 * @returns {Promise<object | null>}
 */
const findByEmailWithPassword = (email) =>
  prisma.user.findUnique({ where: { email } });

/**
 * Cria um novo usuário.
 * @param {{ name: string, email: string, passwordHash: string, role?: string }} data
 * @returns {Promise<PublicUser>}
 */
const create = (data) =>
  prisma.user.create({ data, select: PUBLIC_FIELDS });

/**
 * Atualiza campos de um usuário pelo ID.
 * @param {number} id
 * @param {{ name?: string, email?: string, role?: string }} data
 * @returns {Promise<PublicUser>}
 */
const update = (id, data) =>
  prisma.user.update({ where: { id }, data, select: PUBLIC_FIELDS });

/**
 * Soft-delete: marca o usuário como inativo sem remover fisicamente.
 * Preserva integridade referencial nos logs de auditoria.
 * @param {number} id
 * @returns {Promise<PublicUser>}
 */
const softDelete = (id) =>
  prisma.user.update({
    where:  { id },
    data:   { isActive: false },
    select: PUBLIC_FIELDS,
  });

module.exports = {
  findAll,
  findById,
  findByIdWithPassword,
  findByEmail,
  findByEmailWithPassword,
  create,
  update,
  softDelete,
};
