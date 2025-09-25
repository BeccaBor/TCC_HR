const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./authRoutes');
const gestorRoutes = require('./gestorRoutes');
const colaboradorRoutes = require('./colaboradorRoutes');
const uploadRoutes = require('./uploadRoutes');
const { verificarToken } = require('../middlewares/authMiddleware');

// Rotas de autenticação (login, register)
router.use('/auth', authRoutes);

// Rotas de gestores (protegidas internamente pelo middleware do gestorRoutes)
router.use('/gestor', verificarToken, gestorRoutes);

// Rotas de colaboradores (protegidas internamente pelo middleware do colaboradorRoutes)
router.use('/colaborador', verificarToken, colaboradorRoutes);

// Rotas de upload (pode verificar token dentro do uploadRoutes se necessário)
router.use('/upload', verificarToken, uploadRoutes);

module.exports = router;
