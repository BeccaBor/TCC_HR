// const express = require('express');
// const router = express.Router();
// const gerenciarPontoController = require('../controllers/gerenciarPontoController');
// const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

// // Registrar ponto (acessível para colaboradores)
// router.post('/registrar', verificarToken, gerenciarPontoController.registrarPonto);

// // Listar registros recentes do próprio colaborador
// router.get('/recentes', verificarToken, gerenciarPontoController.getRecent);

// // Listar registros de toda a empresa (apenas gestores)
// router.get(
//   '/empresa',
//   verificarToken,
//   autorizarTipoUsuario(['gestor']),
//   gerenciarPontoController.getRecentEmpresa
// );

// module.exports = router;
