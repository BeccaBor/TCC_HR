// backend/routes/setorRoutes.js
const express = require("express");
const router = express.Router();
const setorController = require("../controllers/setorController");
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

// Cadastro de setor (apenas gestores)
router.post("/register", verificarToken, autorizarTipoUsuario(['gestor']), setorController.register);

// Listagem de setores (apenas gestores)
router.get("/listar", verificarToken, autorizarTipoUsuario(['gestor']), setorController.listar);

module.exports = router;
