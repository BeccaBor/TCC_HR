// backend/routes/empresaRoutes.js
const express = require('express');
const router = express.Router();
const { cadastrarEmpresa } = require('../controllers/empresaController');

// POST /auth/registerEmpresa
router.post('/registerEmpresa', cadastrarEmpresa);

module.exports = router;
