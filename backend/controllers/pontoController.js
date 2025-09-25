// backend/controllers/pontoController.js
const pontoModel = require('../models/pontoModel');

/**
 * Registrar ponto
 */
exports.registrar = async (req, res) => {
  try {
    const { tipo_registro, horas, setor } = req.body;

    const usuarioId = req.usuario?.id;
    const nome = req.usuario?.nome;
    const tipo_usuario = req.usuario?.tipo; // "gestor" ou "colaborador"
    const cnpj = req.usuario?.cnpj;

    if (!usuarioId || !nome || !tipo_usuario || !cnpj) {
      return res.status(400).json({ message: 'Dados do usuário não encontrados.' });
    }

    if (!tipo_registro || !horas) {
      return res.status(400).json({ message: 'Tipo de registro e horas são obrigatórios.' });
    }

    const registro = await pontoModel.registrar({
      usuarioId,
      nome,
      setor,
      tipo_usuario,
      tipo_registro,
      horas,
      cnpj
    });

    return res.status(201).json({ message: 'Ponto registrado com sucesso.', registro });
  } catch (err) {
    console.error('Erro ao registrar ponto:', err);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

/**
 * Buscar últimos registros do usuário logado
 */
exports.getMeusRegistros = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;
    const cnpj = req.usuario?.cnpj;

    if (!usuarioId || !cnpj) {
      return res.status(400).json({ message: 'Dados do usuário não encontrados.' });
    }

    const registros = await pontoModel.getByUsuario(usuarioId, cnpj, 20);

    return res.status(200).json({ registros });
  } catch (err) {
    console.error('Erro ao buscar registros do usuário:', err);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

/**
 * Buscar registros de toda a empresa (apenas gestor)
 */
exports.getRegistrosEmpresa = async (req, res) => {
  try {
    const cnpj = req.usuario?.cnpj;

    if (!cnpj) {
      return res.status(400).json({ message: 'CNPJ não encontrado.' });
    }

    const registros = await pontoModel.getByEmpresa(cnpj, 100);

    return res.status(200).json({ registros });
  } catch (err) {
    console.error('Erro ao buscar registros da empresa:', err);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};
