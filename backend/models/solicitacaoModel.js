const db = require('../config/db');

const SolicitacaoModel = {
  // Cria uma nova solicitação no banco de dados
  async criar({ colaborador_id, tipo_solicitacao, descricao }) {
    if (!colaborador_id || !tipo_solicitacao) {
      throw new Error('Campos obrigatórios ausentes: colaborador_id ou tipo_solicitacao');
    }

    try {
      const [resultado] = await db.query(
        'INSERT INTO realizarsolicitacoes (colaborador_id, tipo_solicitacao, descricao, data_solicitacao, status) VALUES (?, ?, ?, NOW(), "pendente")',
        [colaborador_id, tipo_solicitacao, descricao || null]
      );
      return resultado; // Retorna insertId
    } catch (err) {
      console.error('Erro em SolicitacaoModel.criar:', err);
      throw new Error('Erro ao criar solicitação no banco de dados.');
    }
  },

  // Lista todas as solicitações de um colaborador específico
  async listarPorColaborador(colaboradorId) {
    if (!colaboradorId) return [];
    try {
      const [solicitacoes] = await db.query(
        'SELECT id, tipo_solicitacao, descricao, data_solicitacao, status FROM realizarsolicitacoes WHERE colaborador_id = ? ORDER BY data_solicitacao DESC',
        [colaboradorId]
      );
      return solicitacoes || [];
    } catch (err) {
      console.error('Erro em SolicitacaoModel.listarPorColaborador:', err);
      throw new Error('Erro ao listar solicitações no banco de dados.');
    }
  },

  // Buscar uma solicitação pelo ID 
  async buscarPorId(solicitacaoId) {
    if (!solicitacaoId) return null;
    try {
      const [solicitacao] = await db.query(
        'SELECT id, colaborador_id, tipo_solicitacao, descricao, data_solicitacao, status FROM realizarsolicitacoes WHERE id = ?',
        [solicitacaoId]
      );
      return solicitacao[0] || null;
    } catch (err) {
      console.error('Erro em SolicitacaoModel.buscarPorId:', err);
      throw new Error('Erro ao buscar solicitação no banco de dados.');
    }
  },

  // Atualiza o status de uma solicitação (usado pelo gestor)
  async atualizarStatus(solicitacaoId, status, dataAprovacaoRejeicao) {
    if (!solicitacaoId || !status) {
      throw new Error('ID da solicitação e status são obrigatórios para atualizar');
    }

    try {
      const [resultado] = await db.query(
        'UPDATE realizarsolicitacoes SET status = ?, data_aprovacao_rejeicao = ? WHERE id = ?',
        [status, dataAprovacaoRejeicao || null, solicitacaoId]
      );
      return resultado;
    } catch (err) {
      console.error('Erro em SolicitacaoModel.atualizarStatus:', err);
      throw new Error('Erro ao atualizar status da solicitação no banco de dados.');
    }
  }
};

module.exports = SolicitacaoModel;
