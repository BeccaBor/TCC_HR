const express = require('express');
const router = express.Router();
const gestorController = require('../controllers/gestorController');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // Importando o middleware de upload
const uploadController = require('../controllers/uploadController');
const pontoController = require('../controllers/pontoController');

// Middleware para proteger todas as rotas do gestor
router.use(verificarToken, autorizarTipoUsuario(['gestor']));

// Perfil
router.get('/perfil', gestorController.getProfile);
router.put('/atualizar', gestorController.update);
router.delete('/deletar', gestorController.delete);

// Upload
// Rota para upload de documentos do gestor
router.post('/upload', upload.single('arquivo'), uploadController.realizarUpload);  // Rota de upload para gestores

// --- Rotas de Ponto (gestor) ---
router.post('/ponto/marcar', pontoController.registrar);
router.get('/ponto/ultimos', pontoController.getMeusRegistros);
router.get('/ponto/registros', pontoController.getRegistrosEmpresa);

module.exports = router;
