// backend/controllers/solicitacaoController.js
const SolicitacaoModel = require('../models/solicitacaoModel');
const db = require('../config/db');

const solicitacaoController = {
  // Colaborador: criar nova solicitação
  async criarSolicitacao(req, res) {
    try {
      if (!req.usuario) return res.status(401).json({ erro: 'Não autenticado.' });

      const usuario_id = req.usuario.id;
      const { tipo_solicitacao, descricao } = req.body;

      if (!tipo_solicitacao) {
        return res.status(400).json({ erro: 'O tipo da solicitação é obrigatório.' });
      }

      const novaSolicitacao = { usuario_id, tipo_solicitacao, descricao: descricao || null };
      const resultado = await SolicitacaoModel.criar(novaSolicitacao);

      return res.status(201).json({ id: resultado.insertId, mensagem: 'Solicitação criada com sucesso.' });
    } catch (err) {
      console.error('Erro ao criar solicitação:', err);
      return res.status(500).json({ erro: 'Erro interno ao criar solicitação.' });
    }
  },

  // Colaborador: listar suas próprias solicitações
  async listarMinhasSolicitacoes(req, res) {
    try {
      if (!req.usuario) return res.status(401).json({ erro: 'Não autenticado.' });

      const usuarioId = req.usuario.id;
      const solicitacoes = await SolicitacaoModel.listarPorUsuario(usuarioId);

      return res.json(solicitacoes || []);
    } catch (err) {
      console.error('Erro ao listar solicitações do usuário:', err);
      return res.status(500).json({ erro: 'Erro interno ao listar solicitações.' });
    }
  },

  // Gestor: aprovar solicitação
  async aprovarSolicitacao(req, res) {
    try {
      if (!req.usuario || req.usuario.tipo_usuario !== 'Gestor') {
        return res.status(403).json({ erro: 'Apenas gestores podem aprovar solicitações.' });
      }

      const { id } = req.params;
      const solicitacao = await SolicitacaoModel.buscarPorId(id);

      if (!solicitacao) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
      if (solicitacao.status !== 'pendente') return res.status(400).json({ erro: 'Esta solicitação já foi processada.' });

      await SolicitacaoModel.atualizarStatus(id, 'aprovada', new Date());
      return res.json({ mensagem: 'Solicitação aprovada com sucesso.' });
    } catch (err) {
      console.error('Erro ao aprovar solicitação:', err);
      return res.status(500).json({ erro: 'Erro interno ao aprovar solicitação.' });
    }
  },

  // Gestor: rejeitar solicitação
  async rejeitarSolicitacao(req, res) {
    try {
      if (!req.usuario || req.usuario.tipo_usuario !== 'Gestor') {
        return res.status(403).json({ erro: 'Apenas gestores podem rejeitar solicitações.' });
      }

      const { id } = req.params;
      const solicitacao = await SolicitacaoModel.buscarPorId(id);

      if (!solicitacao) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
      if (solicitacao.status !== 'pendente') return res.status(400).json({ erro: 'Esta solicitação já foi processada.' });

      await SolicitacaoModel.atualizarStatus(id, 'rejeitada', new Date());
      return res.json({ mensagem: 'Solicitação rejeitada com sucesso.' });
    } catch (err) {
      console.error('Erro ao rejeitar solicitação:', err);
      return res.status(500).json({ erro: 'Erro interno ao rejeitar solicitação.' });
    }
  },

  // Gestor: listar todas as solicitações
  async listarTodasSolicitacoes(req, res) {
    try {
      if (!req.usuario || req.usuario.tipo_usuario !== 'Gestor') {
        return res.status(403).json({ erro: 'Apenas gestores podem listar todas as solicitações.' });
      }

      const [solicitacoes] = await db.query(
        `SELECT rs.*, u.nome AS usuario_nome, u.cnpj AS usuario_cnpj
         FROM realizarsolicitacoes rs
         JOIN usuario u ON rs.usuario_id = u.id
         ORDER BY rs.data_solicitacao DESC`
      );

      return res.json(solicitacoes || []);
    } catch (err) {
      console.error('Erro ao listar todas as solicitações:', err);
      return res.status(500).json({ erro: 'Erro interno ao listar todas as solicitações.' });
    }
  }
};

module.exports = solicitacaoController;
