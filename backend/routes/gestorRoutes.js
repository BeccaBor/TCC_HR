const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const gestorController = require('../controllers/gestorController');
const pontoController = require('../controllers/pontoController');
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/uploadMiddleware');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

// --- Rotas de autenticação ---
router.post('/login', authController.login);
router.get('/me', verificarToken, autorizarTipoUsuario(['gestor']), authController.me);

// Middleware para todas as rotas do gestor (após login)
router.use(verificarToken, autorizarTipoUsuario(['gestor']));

// --- Rotas de perfil ---
router.get('/perfil', gestorController.getProfile);
router.put('/atualizar', gestorController.update);
router.delete('/deletar', gestorController.delete);

// --- Rotas de upload ---
router.post('/upload', upload.single('arquivo'), uploadController.realizarUpload);

// --- Rotas de ponto ---
router.post('/ponto/marcar', pontoController.registrar);
router.get('/ponto/ultimos', pontoController.getMeusRegistros);
router.get('/ponto/registros', pontoController.getRegistrosEmpresa);

module.exports = router;
