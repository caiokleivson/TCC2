const { z } = require("zod");

const updateUserSchema = z.object({
  name: z.string().min(3).optional(),

  email: z.string().email().optional()
});

module.exports = {
  updateUserSchema
};