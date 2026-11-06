const userService = require("../services/userService");

const asyncHandler = require("../utils/asyncHandler");

class UserController {
  findAll = asyncHandler(async (req, res) => {
    const users = await userService.findAll();

    return res.json(users);
  });

  findById = asyncHandler(async (req, res) => {
    const user = await userService.findById(
      Number(req.params.id),
      req.user.id
    );

    return res.json(user);
  });

  update = asyncHandler(async (req, res) => {
    const user = await userService.update(
      Number(req.params.id),
      req.user.id,
      req.body
    );

    return res.json(user);
  });

  delete = asyncHandler(async (req, res) => {
    await userService.delete(
      Number(req.params.id),
      req.user.id
    );

    return res.status(204).send();
  });
}

module.exports = new UserController();