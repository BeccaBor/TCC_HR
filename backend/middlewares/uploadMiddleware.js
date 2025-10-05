// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slugify = require('slugify');

// Diretório padrão de uploads
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Cria a pasta se não existir
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('📁 Pasta "uploads" criada:', UPLOAD_DIR);
  }
} catch (err) {
  console.error('❌ Erro ao criar pasta de uploads:', err);
}

// Limite de upload (MB → bytes)
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 15);
const MAX_FILE_SIZE_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// Tipos permitidos
const ALLOWED_MIMETYPES = new Set([
  'image/jpeg','image/jpg','image/png','image/gif',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain', // .txt
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv'
]);
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|gif|pdf|docx?|txt|xls[x]?|csv)$/i;

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const userId =
      (req.usuario && (req.usuario.id || req.usuario.numero_registro || req.usuario.cnpj)) ||
      'anonimo';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext);

    // Slug seguro para evitar caracteres estranhos
    const safeBase = slugify(base, { lower: true, strict: true }).slice(0, 40);

    const nomeArquivo = `doc-${userId}-${safeBase}-${timestamp}${ext}`;
    cb(null, nomeArquivo);
  }
});

// Filtro de tipo
function fileFilter(req, file, cb) {
  const mimetypeOk = ALLOWED_MIMETYPES.has(file.mimetype);
  const extensionOk = ALLOWED_EXTENSIONS.test(file.originalname || '');
  if (mimetypeOk && extensionOk) {
    return cb(null, true);
  }
  const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
  err.message =
    '❌ Tipo de arquivo não suportado. Permitidos: JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, TXT, XLS, XLSX, CSV.';
  return cb(err, false);
}

// Middleware final
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

// Exporta limites para o front poder exibir
upload.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
upload.MAX_UPLOAD_MB = MAX_UPLOAD_MB;

console.log(`🔧 uploadMiddleware configurado — limite: ${MAX_UPLOAD_MB} MB (${MAX_FILE_SIZE_BYTES} bytes)`);

module.exports = upload;
