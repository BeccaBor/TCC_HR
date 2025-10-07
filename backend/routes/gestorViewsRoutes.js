// backend/routes/gestorViewsRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Render da página principal do gestor (template folhadepagamento)
router.get('/folhadepagamento', async (req, res) => {
  try {
    // se quiser passar dados iniciais (por enquanto deixamos vazio; o front busca via API)
    res.render('folhadepagamento', {});
  } catch (err) {
    console.error('ERR GET /gestor/folhadepagamento', err);
    res.status(500).send('Erro ao abrir folha de pagamento');
  }
});

// Página do colaborador/folha individual (abrirá quando clicar no lápis)
// /gestor/folhapaga?usuarioId=123
router.get('/folhapaga', async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId;
    if (!usuarioId) return res.render('folhapaga', { colaborador: null });

    const [rows] = await db.query('SELECT id, nome, cargo, salario, setor, foto FROM usuario WHERE id = ?', [usuarioId]);
    const colaborador = rows && rows[0] ? rows[0] : null;
    res.render('folhapaga', { colaborador });
  } catch (err) {
    console.error('ERR GET /gestor/folhapaga', err);
    res.status(500).send('Erro ao abrir folha do colaborador');
  }
});

// Rota alternativa por path param: /gestor/folhapaga/:usuarioId
router.get('/folhapaga/:usuarioId', async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;
    const [rows] = await db.query('SELECT id, nome, cargo, salario, setor, foto FROM usuario WHERE id = ?', [usuarioId]);
    const colaborador = rows && rows[0] ? rows[0] : null;
    res.render('folhapaga', { colaborador });
  } catch (err) {
    console.error('ERR GET /gestor/folhapaga/:usuarioId', err);
    res.status(500).send('Erro ao abrir folha do colaborador');
  }
});

module.exports = router;
