const prisma = require("../config/prisma");

class UserRepository {
  async create(data) {
    return prisma.user.create({
      data
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true
      },
      orderBy: {
        id: "asc"
      }
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true
      }
    });
  }

  async delete(id) {
    return prisma.user.delete({
      where: { id }
    });
  }
}

module.exports = new UserRepository();