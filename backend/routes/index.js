// routes/index.js
const express = require('express');
const router = express.Router();

// Importar rotas
const authRoutes = require('./authRoutes');
const gestorRoutes = require('./gestorRoutes');
const colaboradorRoutes = require('./colaboradorRoutes');
const uploadRoutes = require('./uploadRoutes');
const pontoRoutes = require('./pontoRoutes');
const setorRoutes = require('./setorRoutes');
const solicitacoesRoutes = require('./solicitacoesRoutes');
// Observação:
// - Não aplicamos verificarToken aqui globalmente para grupos inteiros,
//   porque cada router (gestor/colaborador) controla quais endpoints são públicos ou protegidos.
// - O app monta esse router como /api (no backend/index.js): app.use('/api', routes);

router.use('/auth', authRoutes);
router.use('/colaborador', colaboradorRoutes);
router.use('/gestor', gestorRoutes);
router.use('/upload', uploadRoutes);
router.use('/ponto', pontoRoutes);
router.use('/setor', setorRoutes);
router.use('/solicitacoes', solicitacoesRoutes);
module.exports = router;
