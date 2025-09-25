const usuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

const usuarioController = {
  async registerColaborador(req, res) {
    try {
      const { numero_registro, nome, cnpj, senha, cargo, setor } = req.body;
      const empresaId = req.usuario?.empresa_id || null;

      if (!numero_registro || !nome || !senha) {
        return res.status(400).json({ erro: 'Campos obrigatórios ausentes (numero_registro, nome, senha).' });
      }

      const existente = await usuarioModel.buscarPorRegistro(numero_registro);
      if (existente) return res.status(409).json({ erro: 'Número de registro já cadastrado.' });

      const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
      const result = await usuarioModel.criar({
        empresa_id: empresaId,
        numero_registro,
        nome,
        cnpj: cnpj || null,
        senha_hash,
        tipo_usuario: 'colaborador',
        cargo: cargo || null,
        setor: setor || null
      });

      return res.status(201).json({ id: result.insertId, numero_registro, mensagem: 'Colaborador registrado com sucesso.' });
    } catch (err) {
      console.error('Erro em registerColaborador:', err);
      return res.status(500).json({ erro: 'Erro interno ao registrar colaborador.' });
    }
  },

  async atualizarColaborador(req, res) {
    try {
      const { id } = req.params;
      const { nome, cnpj, cargo, senha, numero_registro, setor } = req.body;
      const empresaId = req.usuario?.empresa_id;

      const usuarioExistente = await usuarioModel.buscarPorId(id);
      if (!usuarioExistente || usuarioExistente.empresa_id !== empresaId) {
        return res.status(404).json({ erro: 'Colaborador não encontrado ou não pertence à sua empresa.' });
      }

      const updates = [];
      const params = [];

      if (nome) { updates.push('nome = ?'); params.push(nome); }
      if (cnpj) { updates.push('cnpj = ?'); params.push(cnpj); }
      if (cargo) { updates.push('cargo = ?'); params.push(cargo); }
      if (setor) { updates.push('setor = ?'); params.push(setor); }
      if (numero_registro) { updates.push('numero_registro = ?'); params.push(numero_registro); }
      if (senha) {
        const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
        updates.push('senha_hash = ?'); params.push(senha_hash);
      }

      if (updates.length === 0) return res.status(400).json({ erro: 'Nenhum dado fornecido para alteração.' });

      params.push(id);
      const q = `UPDATE usuario SET ${updates.join(', ')} WHERE id = ?`;
      const [result] = await db.query(q, params);

      return res.json({ mensagem: 'Colaborador atualizado', affectedRows: result.affectedRows });
    } catch (err) {
      console.error('Erro em atualizarColaborador:', err);
      return res.status(500).json({ erro: 'Erro interno ao atualizar colaborador.' });
    }
  },

  async excluirColaborador(req, res) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario?.empresa_id;

      const usuarioExistente = await usuarioModel.buscarPorId(id);
      if (!usuarioExistente || usuarioExistente.empresa_id !== empresaId) {
        return res.status(404).json({ erro: 'Colaborador não encontrado.' });
      }

      const [result] = await db.query('DELETE FROM usuario WHERE id = ? AND empresa_id = ?', [id, empresaId]);
      return res.json({ mensagem: 'Colaborador excluído', affectedRows: result.affectedRows });
    } catch (err) {
      console.error('Erro em excluirColaborador:', err);
      return res.status(500).json({ erro: 'Erro interno ao excluir colaborador.' });
    }
  },

  async listarColaboradores(req, res) {
    try {
      const empresaId = req.usuario?.empresa_id;
      const colaboradores = await usuarioModel.listarPorEmpresa(empresaId);
      return res.json({ colaboradores: colaboradores || [] });
    } catch (err) {
      console.error('Erro em listarColaboradores:', err);
      return res.status(500).json({ erro: 'Erro interno ao listar colaboradores.' });
    }
  }
};

module.exports = usuarioController;
