// backend/routes/gestorApiRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // usa a pool/connection que já existe

// GET /api/gestor/colaboradores
router.get('/colaboradores', async (req, res) => {
  try {
    // opcional: filtro por setor via query ?setor=Nome
    const filtroSetor = req.query.setor;
    let sql = 'SELECT id, nome, cargo, salario, setor, foto, tipo_usuario FROM usuario WHERE tipo_usuario = ?';
    let params = ['colaborador'];
    if (filtroSetor && filtroSetor !== 'Todos') {
      sql += ' AND setor = ?';
      params.push(filtroSetor);
    }
    const [rows] = await db.query(sql, params);
    return res.json({ success: true, colaboradores: rows });
  } catch (err) {
    console.error('ERR /api/gestor/colaboradores', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/gestor/setores
router.get('/setores', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome_setor FROM setores ORDER BY nome_setor');
    // adiciona opção "Todos"
    const setores = [{ id: 0, nome_setor: 'Todos' }, ...rows];
    return res.json({ success: true, setores });
  } catch (err) {
    console.error('ERR /api/gestor/setores', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// dentro do arquivo gestorApiRoutes.js (após as rotas GET)
router.post('/calcular', async (req, res) => {
  try {
    const { usuarioId, salarioBruto } = req.body;
    // Exemplo simples de cálculos:
    const salario = Number(salarioBruto || 0);
    const inss = +(salario * 0.08).toFixed(2); // apenas ex: 8%
    const irrf = +(salario * 0.075).toFixed(2); // ex: 7.5%
    const fgts = +(salario * 0.08).toFixed(2);
    const totalDescontos = +(inss + irrf).toFixed(2);
    const liquido = +(salario - totalDescontos).toFixed(2);

    return res.json({
      success: true,
      result: {
        salarioBruto: salario,
        inss, irrf, fgts, totalDescontos, liquido
      }
    });
  } catch (err) {
    console.error('ERR /api/gestor/calcular', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
