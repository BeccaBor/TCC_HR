// backend/controllers/empresaController.js
const bcrypt = require('bcrypt');
const empresaModel = require('../models/empresaModel');
const SALT_ROUNDS = 10;

async function cadastrarEmpresa(req, res) {
  const { nomeEmpresa, cnpj, senha } = req.body;

  if (!nomeEmpresa || !cnpj || !senha) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  try {
    // 1 - Verificar se CNPJ já existe
    const existingEmpresa = await empresaModel.buscarPorCNPJ(cnpj);
    if (existingEmpresa) {
      return res.status(400).json({ message: 'CNPJ já cadastrado' });
    }

    // 2 - Gerar hash da senha
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // 3 - Criar empresa
    const empresaResult = await empresaModel.criar({ nomeEmpresa, cnpj, senhaHash });
    const empresaId = empresaResult.insertId;

    // 4 - Criar gestor padrão na tabela usuario
    const numeroRegistro = `G${empresaId}`; // registro único do gestor
    await empresaModel.criarGestor({
      empresaId,
      numeroRegistro,
      nome: nomeEmpresa,
      cnpj,
      senhaHash
    });

    // 5 - Retornar sucesso com registro do gestor
    return res.status(201).json({
      message: 'Empresa cadastrada com sucesso!',
      registroGestor: numeroRegistro
    });

  } catch (err) {
    console.error('Erro no cadastro de empresa:', err);
    return res.status(500).json({ message: 'Erro interno ao cadastrar usuário' });
  }
}

module.exports = { cadastrarEmpresa };
