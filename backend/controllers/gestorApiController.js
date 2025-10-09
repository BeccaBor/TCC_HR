// backend/controllers/gestorApiController.js
const db = require('../config/db');
const folhaService = require('../services/folhadePagamentoService');

const GestorApiController = {

  // GET /api/gestor/setores
  async listarSetores(req, res) {
    try {
      const empresaId = req.usuario && req.usuario.empresa_id;
      if (!empresaId) return res.status(401).json([]);
      const [rows] = await db.query('SELECT id, nome_setor AS nome FROM setores WHERE empresa_id = ?', [empresaId]);
      res.json(rows || []);
    } catch (err) {
      console.error(err);
      res.status(500).json([]);
    }
  },

  // GET /api/gestor/colaboradores?setorId=...
  async listarColaboradores(req, res) {
    try {
      const empresaId = req.usuario && req.usuario.empresa_id;
      if (!empresaId) return res.status(401).json([]);
      const { setorId } = req.query;

      // se setorId passado, pega o nome do setor e filtra por usuario.setor (string)
      let params = [empresaId];
      let sql = `SELECT id, nome, cargo, setor, salario, NULL as status, horas_diarias FROM usuario WHERE empresa_id = ? AND tipo_usuario IN ('colaborador','gestor')`;

      if (setorId) {
        const [setRow] = await db.query('SELECT nome_setor FROM setores WHERE id = ? AND empresa_id = ?', [setorId, empresaId]);
        if (setRow && setRow.length > 0) {
          const nomeSetor = setRow[0].nome_setor;
          sql += ' AND setor = ?';
          params.push(nomeSetor);
        }
      }

      const [rows] = await db.query(sql, params);
      res.json(rows || []);
    } catch (err) {
      console.error(err);
      res.status(500).json([]);
    }
  },

  // GET /api/gestor/colaborador/:id
  async getColaborador(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario && req.usuario.empresa_id;
      const [rows] = await db.query('SELECT id, nome, salario, cargo, setor, horas_diarias, dependentes FROM usuario WHERE id = ? AND empresa_id = ?', [id, empresaId]);
      if (!rows || rows.length === 0) return res.status(404).json({ erro: 'Não encontrado' });
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: 'Erro interno' });
    }
  },

  // POST /api/gestor/colaborador/:id/calcular
  async calcularColaborador(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario && req.usuario.empresa_id;
      const { salario, horas_diarias, dependentes, horas_extras } = req.body;

      const [rows] = await db.query('SELECT * FROM usuario WHERE id = ? AND empresa_id = ?', [id, empresaId]);
      if (!rows || rows.length === 0) return res.status(404).json({ erro: 'Não encontrado' });
      const colaborador = rows[0];

      const input = {
        id: colaborador.id,
        nome: colaborador.nome,
        salarioBase: Number(salario ?? colaborador.salario ?? 0),
        horasDiarias: Number(horas_diarias ?? colaborador.horas_diarias ?? 8),
        dependentes: Number(dependentes ?? 0),
        horasExtras: Number(horas_extras ?? 0)
      };

      if (typeof folhaService.calcularFolhaFuncionario === 'function') {
        const resultado = await folhaService.calcularFolhaFuncionario(input);
        return res.json(resultado);
      }

      // fallback simplificado (se o service não tiver a função)
      const proventos = input.salarioBase + (input.horasExtras * (input.salarioBase / 220));
      const totalINSS = folhaService.calcularINSS ? folhaService.calcularINSS(input.salarioBase) : 0;
      const totalIRRF = folhaService.calcularIRRF ? folhaService.calcularIRRF(input.salarioBase - totalINSS - (input.dependentes * 189.59)) : 0;
      const totalFGTS = folhaService.calcularFGTS ? folhaService.calcularFGTS(input.salarioBase) : (input.salarioBase * 0.08);
      const totalDescontos = Number(totalINSS) + Number(totalIRRF);
      const totalLiquido = proventos - totalDescontos;

      return res.json({
        salarioBase: input.salarioBase,
        totalProventos: proventos,
        totalINSS,
        totalIRRF,
        totalFGTS,
        totalDescontos,
        totalLiquido
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: 'Erro ao calcular' });
    }
  },

  // POST /api/gestor/colaborador/:id/update
  async updateColaborador(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario && req.usuario.empresa_id;
      const { salario, horas_diarias, dependentes } = req.body;

      await db.query(
        `UPDATE usuario SET salario = ?, horas_diarias = ?, dependentes = ? WHERE id = ? AND empresa_id = ?`,
        [salario || 0, horas_diarias || 8, dependentes || 0, id, empresaId]
      );

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, erro: 'Erro ao atualizar' });
    }
  },

  // DELETE /api/gestor/colaborador/:id
  async deleteColaborador(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario && req.usuario.empresa_id;
      await db.query('DELETE FROM usuario WHERE id = ? AND empresa_id = ?', [id, empresaId]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  }

};

module.exports = GestorApiController;
