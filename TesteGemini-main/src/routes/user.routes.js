const { Router } = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middlewares/validate');
const { authenticateToken, authorizeUserOwner } = require('../middlewares/auth');
const { globalLimiter, authLimiter } = require('../middlewares/rateLimiter');
const { createUserSchema, loginSchema, updateUserSchema } = require('../validators/user.validator');

const router = Router();

router.use(globalLimiter); // Aplica em todas as rotas de usuário

// Públicas
router.post('/register', validate(createUserSchema), userController.create);
router.post('/login', authLimiter, validate(loginSchema), userController.login); // Limite estrito no login

// Protegidas (Requerem Autenticação e Autorização BOLA)
router.use(authenticateToken); 

router.get('/', userController.getAll); // Admin ou uso genérico (sem BOLA)
router.get('/:id', authorizeUserOwner, userController.getById);
router.put('/:id', authorizeUserOwner, validate(updateUserSchema), userController.update);
router.delete('/:id', authorizeUserOwner, userController.delete);

module.exports = router;