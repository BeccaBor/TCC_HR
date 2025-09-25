// backend/controllers/holeriteController.js
const HoleriteModel = require('../models/holeriteModel');

const holeriteController = {
  // Colaborador: Visualizar seus próprios holerites
  async visualizarMeusHolerites(req, res) {
    try {
      if (!req.usuario) {
        return res.status(401).json({ erro: 'Não autenticado' });
      }

      const colaboradorId = req.usuario.id;
      const holerites = await HoleriteModel.visualizarMeusHolerites(colaboradorId);

      return res.json(holerites || []);
    } catch (err) {
      console.error('Erro ao visualizar holerites:', err);
      return res.status(500).json({ erro: 'Erro interno ao buscar holerites' });
    }
  },

  // Gestor: Adicionar um novo holerite para um colaborador
  async adicionarHolerite(req, res) {
    if (!req.usuario || req.usuario.tipo_usuario !== 'Gestor') {
      return res.status(403).json({ erro: 'Apenas gestores podem adicionar holerites.' });
    }

    const { colaborador_id, mes_referencia, salario, arquivo_pdf } = req.body;

    if (!colaborador_id || !mes_referencia || !salario || !arquivo_pdf) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios para adicionar holerite.' });
    }

    try {
      const resultado = await HoleriteModel.criarHolerite({
        colaborador_id,
        mes_referencia,
        salario,
        arquivo_pdf
      });

      return res.status(201).json({
        id: resultado.insertId,
        mensagem: 'Holerite adicionado com sucesso.'
      });
    } catch (err) {
      console.error('Erro ao adicionar holerite:', err);
      return res.status(500).json({ erro: 'Erro interno ao adicionar holerite' });
    }
  }
};

module.exports = holeriteController;
