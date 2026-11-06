const express = require("express");

const userController = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");

const validate = require("../middlewares/validateMiddleware");

const {
  updateUserSchema
} = require("../validations/userValidation");

const router = express.Router();

router.use(authMiddleware);

router.get("/", userController.findAll);

router.get("/:id", userController.findById);

router.put(
  "/:id",
  validate(updateUserSchema),
  userController.update
);

router.delete("/:id", userController.delete);

module.exports = router;