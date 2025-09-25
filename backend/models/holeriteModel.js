const db = require('../config/db');

const HoleriteModel = {
  // Visualiza todos os holerites de um colaborador
  async visualizarMeusHolerites(colaboradorId) {
    if (!colaboradorId) return [];
    try {
      const [rows] = await db.query(
        'SELECT id, colaborador_id, mes_referencia, salario, arquivo_pdf, criado_em FROM visualizarholerites WHERE colaborador_id = ? ORDER BY mes_referencia DESC',
        [colaboradorId]
      );
      return rows || [];
    } catch (err) {
      console.error('Erro em HoleriteModel.visualizarMeusHolerites:', err);
      return [];
    }
  },

  // Cria um novo holerite
  async criarHolerite({ colaborador_id, mes_referencia, salario, arquivo_pdf }) {
    if (!colaborador_id || !mes_referencia || salario === undefined || !arquivo_pdf) {
      throw new Error('Campos obrigatórios ausentes: colaborador_id, mes_referencia, salario ou arquivo_pdf');
    }

    try {
      const q = `INSERT INTO visualizarholerites (colaborador_id, mes_referencia, salario, arquivo_pdf, criado_em) 
                 VALUES (?, ?, ?, ?, NOW())`;
      const [result] = await db.query(q, [colaborador_id, mes_referencia, salario, arquivo_pdf]);
      return result;
    } catch (err) {
      console.error('Erro em HoleriteModel.criarHolerite:', err);
      throw err;
    }
  },

  // Atualiza um holerite existente
  async atualizarHolerite({ id, salario, arquivo_pdf }) {
    if (!id) throw new Error('ID do holerite é obrigatório para atualizar');

    try {
      const updates = [];
      const params = [];

      if (salario !== undefined) {
        updates.push('salario = ?');
        params.push(salario);
      }
      if (arquivo_pdf) {
        updates.push('arquivo_pdf = ?');
        params.push(arquivo_pdf);
      }

      if (updates.length === 0) return null;

      params.push(id);
      const [resultado] = await db.query(
        `UPDATE visualizarholerites SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      return resultado;
    } catch (err) {
      console.error('Erro em HoleriteModel.atualizarHolerite:', err);
      throw err;
    }
  },

  // Exclui um holerite pelo ID
  async excluirHolerite(id) {
    if (!id) throw new Error('ID do holerite é obrigatório para exclusão');
    try {
      const [resultado] = await db.query(
        'DELETE FROM visualizarholerites WHERE id = ?',
        [id]
      );
      return resultado;
    } catch (err) {
      console.error('Erro em HoleriteModel.excluirHolerite:', err);
      throw err;
    }
  }
};

module.exports = HoleriteModel;
