// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/uploadMiddleware');
const { verificarToken } = require('../middlewares/authMiddleware');

/**
 * ============================================
 * Rotas de Upload, Download e Listagem de Documentos
 * Base: /api/upload
 * --------------------------------------------
 * Exemplos:
 *   - POST   /api/upload                → Upload genérico
 *   - POST   /api/upload/usuario/upload → Upload do usuário autenticado
 *   - POST   /api/upload/colaborador/upload → Upload de colaborador
 *   - GET    /api/upload/documentos     → Listar todos documentos (admin/público)
 *   - GET    /api/upload/colaborador/uploads → Listar uploads do colaborador logado
 *   - GET    /api/upload/download/:id   → Download de documento
 * ============================================
 */

/** 
 * 🔓 Público (pode ser restrito futuramente se necessário)
 * Lista todos os documentos
 */
router.get('/documentos', uploadController.listarTodos);

/**
 * 🔐 Upload genérico
 * Aceita campo 'arquivo' (ou 'documento')
 */
router.post(
  '/',
  verificarToken,
  upload.single('arquivo'),
  uploadController.realizarUpload
);

/**
 * 🔐 Upload específico para usuário autenticado
 * Frontend deve enviar no campo: 'documento'
 */
router.post(
  '/usuario/upload',
  verificarToken,
  upload.single('documento'),
  uploadController.realizarUpload
);

/**
 * 🔐 Upload específico para colaborador autenticado
 * Frontend deve enviar no campo: 'documento'
 */
router.post(
  '/colaborador/upload',
  verificarToken,
  upload.single('documento'),
  uploadController.realizarUpload
);

/**
 * 🔐 Listagem de uploads do colaborador autenticado
 */
router.get(
  '/colaborador/uploads',
  verificarToken,
  uploadController.listarMeusUploads
);

/**
 * 🔐 Download de documento por ID
 */
router.get(
  '/download/:id',
  verificarToken,
  uploadController.downloadArquivo
);

module.exports = router;
