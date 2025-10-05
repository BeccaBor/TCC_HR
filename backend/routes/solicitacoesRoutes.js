// backend/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const solicitacoesController = require('../controllers/solicitacoesController');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

// Pasta de uploads (configurável via env)
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '..', 'uploads');

// garante que a pasta exista
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (err) {
  console.error('Falha ao criar pasta de uploads:', UPLOADS_DIR, err);
  // não throw aqui para não quebrar o boot do app, mas você pode querer parar a aplicação em produção
}

// Limite de upload (MB) — default 15MB
const MAX_UPLOAD_MB = process.env.MAX_UPLOAD_MB ? Number(process.env.MAX_UPLOAD_MB) : 15;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // usa id do usuário quando disponível (verificarToken é executado antes do upload na rota)
    const userPart = (req.usuario && req.usuario.id) ? `u${req.usuario.id}-` : '';
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const ext = path.extname(file.originalname || '') || '';
    const safeName = (file.originalname || 'anexo').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\.\-_]/g, '');
    cb(null, `${userPart}${unique}${ext || path.extname(safeName)}`);
  }
});

// filtro de tipos permitidos
function fileFilter(req, file, cb) {
  const allowed = /\.(pdf|jpe?g|png)$/i;
  const original = file.originalname || '';
  if (!allowed.test(original)) {
    return cb(new Error('Tipo de arquivo não permitido. Permitidos: pdf, jpg, jpeg, png'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter
});

// Observações:
// - As rotas abaixo costumam ser montadas em /api/solicitacoes no seu index de rotas.
// - O middleware verificarToken precisa popular req.usuario (ou req.user). Garantir essa ordem (verificarToken antes do upload).

// Criar solicitação (aceita multipart/form-data com campo 'anexo')
router.post(
  '/',
  verificarToken,
  upload.single('anexo'), // espera campo 'anexo' do front
  solicitacoesController.criar
);

// Listar minhas solicitações (usuário autenticado)
router.get(
  '/me',
  verificarToken,
  solicitacoesController.listarMe
);

// Buscar por id (autenticado)
router.get(
  '/:id',
  verificarToken,
  solicitacoesController.getById
);

// Atualizar status (apenas gestores) - mantido PUT por compatibilidade com seu controller
// Sugestão: usar PATCH /:id/status para semanticamente indicar "alteração parcial"
router.put(
  '/:id/status',
  verificarToken,
  autorizarTipoUsuario(['gestor']),
  solicitacoesController.atualizarStatus
);

// Listar todos (apenas gestores)
router.get(
  '/',
  verificarToken,
  autorizarTipoUsuario(['gestor']),
  solicitacoesController.listarTodos
);

module.exports = router;
