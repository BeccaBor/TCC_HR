const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/uploadMiddleware');
const { verificarToken } = require('../middlewares/authMiddleware');

// 🔓 Rota pública - listar todos os documentos
router.get('/documentos', uploadController.listarTodos);

// 🔒 Rota protegida - upload de documentos (gestor ou colaborador)
router.post(
  '/',
  verificarToken,
  upload.single('arquivo'),
  uploadController.realizarUpload
);

// 🔒 Rota protegida - upload de documentos do usuário autenticado
router.post(
  '/usuario/upload',
  verificarToken,
  upload.single('documento'),
  uploadController.realizarUpload
);

// 🔒 Rota protegida - download de arquivos
router.get(
  '/download/:id',
  verificarToken,
  uploadController.downloadArquivo
);

// 🔒 Rota protegida - listar uploads do usuário logado
router.get(
  '/usuario/uploads',
  verificarToken,
  uploadController.listarMeusUploads
);

module.exports = router;
