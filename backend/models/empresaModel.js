// backend/models/empresaModel.js
const db = require('../config/db');

const empresaModel = {

  // Busca empresa pelo ID
  async buscarPorId(id) {
    if (!id) return null;
    try {
      const [rows] = await db.query(
        'SELECT id, nome_empresa, cnpj, senha_hash FROM empresa WHERE id = ? LIMIT 1',
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      console.error(`Erro em empresaModel.buscarPorId (id=${id}):`, err);
      return null;
    }
  },

  // Busca empresa pelo CNPJ
  async buscarPorCNPJ(cnpj) {
    if (!cnpj) return null;
    try {
      const [rows] = await db.query(
        'SELECT id, nome_empresa, cnpj, senha_hash FROM empresa WHERE cnpj = ? LIMIT 1',
        [cnpj]
      );
      return rows[0] || null;
    } catch (err) {
      console.error(`Erro em empresaModel.buscarPorCNPJ (cnpj=${cnpj}):`, err);
      return null;
    }
  },

  // Cria nova empresa
  async criar({ nomeEmpresa, cnpj, senhaHash }) {
    if (!nomeEmpresa || !cnpj || !senhaHash) {
      throw new Error('Parâmetros inválidos para criar empresa');
    }
    try {
      const query = 'INSERT INTO empresa (nome_empresa, cnpj, senha_hash) VALUES (?, ?, ?)';
      const [result] = await db.query(query, [nomeEmpresa, cnpj, senhaHash]);
      return result; // contém insertId, affectedRows...
    } catch (err) {
      console.error('Erro em empresaModel.criar:', err);
      throw err;
    }
  },

  // Cria gestor vinculado à empresa
  async criarGestor({ 
    empresaId, 
    numeroRegistro, 
    nome, 
    cnpj, 
    senhaHash, 
    cargo, 
    setor, 
    tipo_jornada, 
    horas_diarias 
  }) {
    if (!empresaId || !numeroRegistro || !nome || !cnpj || !senhaHash || !tipo_jornada || !horas_diarias) {
      throw new Error('Parâmetros inválidos para criar gestor');
    }
    try {
      const query = `
        INSERT INTO usuario
          (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor, tipo_jornada, horas_diarias)
        VALUES (?, ?, ?, ?, ?, 'gestor', ?, ?, ?, ?)
      `;
      const [result] = await db.query(query, [
        empresaId, 
        numeroRegistro, 
        nome, 
        cnpj, 
        senhaHash, 
        cargo, 
        setor, 
        tipo_jornada, 
        horas_diarias
      ]);
      return result;
    } catch (err) {
      console.error('Erro em empresaModel.criarGestor:', err);
      throw err;
    }
  },

  // Lista todas as empresas
  async listar() {
    try {
      const [rows] = await db.query(
        'SELECT id, nome_empresa, cnpj, senha_hash FROM empresa ORDER BY nome_empresa'
      );
      return rows || [];
    } catch (err) {
      console.error('Erro em empresaModel.listar:', err);
      return [];
    }
  }

};

module.exports = empresaModel;
