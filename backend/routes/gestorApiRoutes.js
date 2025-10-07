// backend/routes/gestorApiRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // usa a pool/connection que já existe

// GET /api/gestor/colaboradores
router.get('/colaboradores', async (req, res) => {
  try {
    // opcionais: ?setor=Nome & ?empresa_id=ID
    const filtroSetor = req.query.setor;
    const empresaId = req.query.empresa_id ? Number(req.query.empresa_id) : null;

    let sql = 'SELECT id, nome, cargo, salario, setor, foto, tipo_usuario, empresa_id FROM usuario WHERE tipo_usuario = ?';
    const params = ['colaborador'];

    if (empresaId) {
      sql += ' AND empresa_id = ?';
      params.push(empresaId);
    }
    if (filtroSetor && filtroSetor !== 'Todos') {
      sql += ' AND setor = ?';
      params.push(filtroSetor);
    }

    sql += ' ORDER BY nome';

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
    const empresaId = req.query.empresa_id ? Number(req.query.empresa_id) : null;
    let sql = 'SELECT MIN(id) AS id, nome_setor FROM setores';
    const params = [];
    if (empresaId) {
      sql += ' WHERE empresa_id = ?';
      params.push(empresaId);
    }
    sql += ' GROUP BY nome_setor HAVING nome_setor IS NOT NULL AND nome_setor <> "" AND nome_setor <> "Todos" ORDER BY nome_setor';

    const [rows] = await db.query(sql, params);
    // não incluir "Todos" aqui para evitar duplicidade, o front já insere
    return res.json({ success: true, setores: rows });
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
// --- Rotas adicionais para compatibilidade com folhapaga.js ---

// GET /api/gestor/colaborador/:id
router.get('/colaborador/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT id, nome, cargo, salario, setor, foto FROM usuario WHERE id = ? AND tipo_usuario = ? LIMIT 1',
      [id, 'colaborador']
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Colaborador não encontrado' });
    }
    const c = rows[0];
    // Campos opcionais esperados pelo front (fallbacks handled no front)
    return res.json({
      id: c.id,
      nome: c.nome,
      cargo: c.cargo,
      salario: c.salario,
      setor: c.setor,
      foto: c.foto
    });
  } catch (err) {
    console.error('ERR GET /api/gestor/colaborador/:id', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/gestor/colaborador/:id/calcular
router.post('/colaborador/:id/calcular', async (req, res) => {
  try {
    const salario = Number(req.body.salario || 0);
    const horasExtras = Number(req.body.horas_extras || 0);
    const valorHoraBase = salario / 220; // base simplificada
    const valorHorasExtras = horasExtras * (valorHoraBase * 1.5);
    const salarioBase = +(salario + valorHorasExtras).toFixed(2);

    const totalINSS = +(salarioBase * 0.08).toFixed(2);
    const totalIRRF = +(salarioBase * 0.075).toFixed(2);
    const totalFGTS = +(salarioBase * 0.08).toFixed(2);
    const totalLiquido = +(salarioBase - totalINSS - totalIRRF).toFixed(2);

    return res.json({
      salarioBase,
      totalINSS,
      totalIRRF,
      totalFGTS,
      totalLiquido
    });
  } catch (err) {
    console.error('ERR POST /api/gestor/colaborador/:id/calcular', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/gestor/colaborador/:id/update
router.post('/colaborador/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const salario = Number(req.body.salario || 0);
    // Atualiza apenas salário para evitar dependência de colunas não existentes
    const [result] = await db.query('UPDATE usuario SET salario = ? WHERE id = ?', [salario, id]);
    return res.json({ success: true, affectedRows: result.affectedRows || 0 });
  } catch (err) {
    console.error('ERR POST /api/gestor/colaborador/:id/update', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});
