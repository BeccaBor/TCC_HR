const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const empresaController = require('../controllers/empresaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Login de usuário (gestor ou colaborador)
router.post('/login', authController.login);

// Registro de usuário comum
router.post('/register', authController.register);

// Registro de empresa (gestor inicial)
router.post('/registerEmpresa', empresaController.cadastrarEmpresa);

// Rota para obter dados do usuário logado
router.get('/me', verificarToken, authController.me);

router.post('/logout', (req, res) => {
    console.log('Logout POST recebido');
    res.status(200).json({ message: 'Logout OK' });
  });
module.exports = router;
