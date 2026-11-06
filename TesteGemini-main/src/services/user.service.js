const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

class UserService {
  async createUser(data) {
    const emailExists = await userRepository.findByEmail(data.email);
    if (emailExists) throw new AppError('Este email já está em uso.', 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    return await userRepository.create({ ...data, password: hashedPassword });
  }

  async login(email, password) {
    const user = await userRepository.findByEmailForAuth(email);
    if (!user) throw new AppError('Credenciais inválidas.', 401);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new AppError('Credenciais inválidas.', 401);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email }
    };
  }

  async getAllUsers() {
    return await userRepository.findAll();
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('Usuário não encontrado.', 404);
    return user;
  }

  async updateUser(id, data) {
    await this.getUserById(id); // Valida existência
    
    if (data.email) {
      const emailExists = await userRepository.findByEmail(data.email);
      if (emailExists && emailExists.id !== id) {
        throw new AppError('Este email já está sendo usado por outro usuário.', 409);
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    return await userRepository.update(id, data);
  }

  async deleteUser(id) {
    await this.getUserById(id); // Valida existência
    await userRepository.delete(id);
  }
}

module.exports = new UserService();