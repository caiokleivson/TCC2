const authService = require("../services/authService");

const asyncHandler = require("../utils/asyncHandler");

class AuthController {
  register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);

    return res.status(201).json(user);
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(
      req.body.email,
      req.body.password
    );

    return res.json(result);
  });
}

module.exports = new AuthController();