const prisma = require('../config/db');

class UserRepository {
  // Padronização: Sempre ignorar a senha nos retornos por padrão
  #userSelectFields = { id: true, name: true, email: true, createdAt: true, updatedAt: true };

  async create(data) {
    return await prisma.user.create({ 
      data, 
      select: this.#userSelectFields 
    });
  }

  async findAll() {
    return await prisma.user.findMany({ select: this.#userSelectFields });
  }

  async findById(id) {
    return await prisma.user.findUnique({ 
      where: { id }, 
      select: this.#userSelectFields 
    });
  }

  async findByEmailForAuth(email) {
    // Retorna a senha APENAS para o serviço de autenticação
    return await prisma.user.findUnique({ where: { email } });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({ 
      where: { email },
      select: this.#userSelectFields
    });
  }

  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
      select: this.#userSelectFields
    });
  }

  async delete(id) {
    return await prisma.user.delete({ where: { id } });
  }
}

module.exports = new UserRepository();