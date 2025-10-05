const express = require('express');
const router = express.Router();
const pontoController = require('../controllers/pontoController');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

// Registrar ponto (colaboradores)
router.post('/registrar', verificarToken, pontoController.registrar);

// Listar últimos registros do próprio usuário
router.get('/recentes', verificarToken, pontoController.getMeusRegistros);

// Listar registros de toda a empresa (gestor)
router.get('/empresa', verificarToken, autorizarTipoUsuario(['gestor']), pontoController.getRegistrosEmpresa);

// Endpoint para pegar dados do usuário logado
router.get('/me', verificarToken, pontoController.getMe);

module.exports = router;
