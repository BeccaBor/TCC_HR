const db = require('../config/db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Módulo para interagir com o sistema de arquivos

// Define o diretório de uploads
const uploadDir = path.join(__dirname, '..', 'uploads'); // 'backend/uploads'

// Verifica se o diretório de uploads existe, se não, cria
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Define o destino onde os arquivos serão salvos
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
  // Usar um ID temporário se req.usuario não estiver disponível ainda
  const colaboradorId = req.usuario?.id || 'temp_' + Date.now();
  const timestamp = Date.now();
  const ext = path.extname(file.originalname);
  cb(null, `documento-${colaboradorId}-${timestamp}${ext}`);
}
});

// Filtro de arquivo para permitir apenas alguns tipos
const fileFilter = (req, file, cb) => {
    // Permite apenas imagens e PDFs
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não suportado! Apenas JPG, JPEG, PNG, PDF, DOC, DOCX são permitidos.'));
};

// Instância do Multer com as configurações
// .single('nomeDoCampo') indica que é esperado apenas um arquivo
const uploadMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limite de 5MB por arquivo
    },
    fileFilter: fileFilter
});

module.exports = uploadMiddleware;