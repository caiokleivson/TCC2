const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');

class UserController {
  create = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  });

  getAll = catchAsync(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json(users);
  });

  getById = catchAsync(async (req, res) => {
    const user = await userService.getUserById(parseInt(req.params.id, 10));
    res.json(user);
  });

  update = catchAsync(async (req, res) => {
    const user = await userService.updateUser(parseInt(req.params.id, 10), req.body);
    res.json(user);
  });

  delete = catchAsync(async (req, res) => {
    await userService.deleteUser(parseInt(req.params.id, 10));
    res.status(204).send();
  });
}

module.exports = new UserController();