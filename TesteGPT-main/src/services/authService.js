const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userRepository = require("../repositories/userRepository");

const AppError = require("../utils/AppError");

const { jwtSecret } = require("../config/env");

class AuthService {
  async register(data) {
    const existingUser = await userRepository.findByEmail(
      data.email
    );

    if (existingUser) {
      throw new AppError(
        "Credenciais inválidas.",
        400
      );
    }

    const hashedPassword = await bcrypt.hash(
      data.password,
      12
    );

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError(
        "Credenciais inválidas.",
        401
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      throw new AppError(
        "Credenciais inválidas.",
        401
      );
    }

    const token = jwt.sign(
      {
        userId: user.id
      },
      jwtSecret,
      {
        expiresIn: "1h"
      }
    );

    return {
      token
    };
  }
}

module.exports = new AuthService();