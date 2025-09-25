const express = require('express');
const router = express.Router();
const colaboradorController = require('../controllers/colaboradorController');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');
const pontoController = require('../controllers/pontoController');

// Middleware para proteger todas as rotas do colaborador
router.use(verificarToken, autorizarTipoUsuario(['colaborador']));

// Perfil
router.get('/perfil', colaboradorController.getProfile);
router.put('/atualizar', colaboradorController.update);
router.delete('/deletar', colaboradorController.delete);

// --- Rotas de Ponto (colaborador) ---
router.post('/ponto/marcar', pontoController.registrar);
router.get('/ponto/ultimos', pontoController.getMeusRegistros);

module.exports = router;
