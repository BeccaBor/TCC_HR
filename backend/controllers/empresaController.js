// backend/controllers/empresaController.js
const bcrypt = require('bcrypt');
const empresaModel = require('../models/empresaModel');
const db = require('../config/db');
const SALT_ROUNDS = 10;

// Função auxiliar para validar CNPJ (apenas tamanho e formato)
function validarCNPJ(cnpj) {
  // Verifica se o CNPJ é uma string não vazia
  if (!cnpj) return false;
  // Remove formatação (se houver, embora o frontend já remova)
  const limpo = cnpj.replace(/\D/g, '');
  // Verifica se tem exatamente 14 dígitos
  if (limpo.length !== 14) return false;
  // Verifica se é composto apenas por números
  if (!/^\d+$/.test(limpo)) return false;
  
  // Nota: Idealmente, aqui entraria a lógica de validação do Dígito Verificador do CNPJ (algoritmo)
  
  return true; 
}


async function cadastrarEmpresa(req, res) {
  const { nomeEmpresa, cnpj, senha, gestor } = req.body;

  if (!nomeEmpresa || !cnpj || !senha || !gestor) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  const { nomeGestor, cargo, setor, tipo_jornada, horas_diarias } = gestor;

  if (!nomeGestor || !cargo || !setor || !tipo_jornada || !horas_diarias) {
    return res.status(400).json({ message: 'Campos obrigatórios do gestor ausentes' });
  }
  
  // ***** VALIDAÇÃO CRÍTICA DO CNPJ NO BACKEND (3ª CAMADA DE SEGURANÇA) *****
  if (!validarCNPJ(cnpj)) {
      return res.status(400).json({ message: 'CNPJ inválido. Deve conter exatamente 14 dígitos numéricos.' });
  }
  // *************************************************************************

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

    // 4 - Criar gestor inicial na tabela usuario
    const numeroRegistro = `G${empresaId}`; // registro único do gestor
    await db.query(
      `INSERT INTO usuario 
        (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor, tipo_jornada, horas_diarias)
       VALUES (?, ?, ?, ?, ?, 'gestor', ?, ?, ?, ?)`,
      [empresaId, numeroRegistro, nomeGestor, cnpj, senhaHash, cargo, setor, tipo_jornada, horas_diarias]
    );

    // 5 - Retornar sucesso com registro do gestor
    return res.status(201).json({ 
      message: 'Empresa e Gestor cadastrados com sucesso!', 
      registroGestor: numeroRegistro
    });

  } catch (err) {
    console.error('Erro ao cadastrar empresa e gestor:', err);
    return res.status(500).json({ message: 'Erro interno ao processar cadastro.', erro: err.message });
  }
}

module.exports = {
  cadastrarEmpresa,
  
};
