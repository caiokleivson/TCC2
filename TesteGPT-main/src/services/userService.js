const userRepository = require("../repositories/userRepository");

const AppError = require("../utils/AppError");

class UserService {
  async findAll() {
    return userRepository.findAll();
  }

  async findById(userId, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new AppError(
        "Acesso negado.",
        403
      );
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(
        "Usuário não encontrado.",
        404
      );
    }

    delete user.password;

    return user;
  }

  async update(userId, authenticatedUserId, data) {
    if (userId !== authenticatedUserId) {
      throw new AppError(
        "Acesso negado.",
        403
      );
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(
        "Usuário não encontrado.",
        404
      );
    }

    return userRepository.update(userId, data);
  }

  async delete(userId, authenticatedUserId) {
    if (userId !== authenticatedUserId) {
      throw new AppError(
        "Acesso negado.",
        403
      );
    }

    await userRepository.delete(userId);
  }
}

module.exports = new UserService();