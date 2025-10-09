// backend/routes/folhaPagamentoRoutes.js
const express = require('express');
const router = express.Router();
const folhaController = require('../controllers/folhaPagamentoController');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

// Proteger todas as rotas - apenas gestor pode acessar
router.use(verificarToken);
router.use(autorizarTipoUsuario(['gestor']));

/**
 * POST /api/folha/calcular
 * Calcula folha com dados informados pelo usuário
 * Body: { funcionarioId, mes, salarioBase, horasDiarias, diasTrabalhados, faltas, horasExtras, dependentes }
 */
router.post('/calcular', folhaController.calcularComDadosUsuario);

/**
 * GET /api/folha/:usuarioId?mes=YYYY-MM
 * Calcula folha preliminar de um funcionário
 */
router.get('/:usuarioId', folhaController.calcularFolhaUsuario);

/**
 * POST /api/folha/:usuarioId/processar
 * Processa e grava folha de um funcionário
 * Body: { mes, ajustes, overrides }
 */
router.post('/:usuarioId/processar', folhaController.processarFolhaUsuario);

/**
 * GET /api/folha/empresa/calcular?mes=YYYY-MM
 * Calcula folha de toda a empresa
 */
router.get('/empresa/calcular', folhaController.calcularFolhaEmpresa);

module.exports = router;