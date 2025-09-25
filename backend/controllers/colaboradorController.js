const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Colaborador = require('../models/colaboradorModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const colaboradorController = {
  // Registrar novo colaborador
  async register(req, res) {
    try {
      const { empresa_id, numero_registro, nome, cnpj, senha, cargo, setor } = req.body;

      if (!empresa_id || !numero_registro || !nome || !cnpj || !senha) {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios' });
      }

      const novoColaborador = await Colaborador.create({ empresa_id, numero_registro, nome, cnpj, senha, cargo, setor });
      return res.status(201).json({ success: true, message: 'Colaborador registrado com sucesso', data: novoColaborador });
    } catch (error) {
      console.error('Erro ao registrar colaborador:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Login do colaborador
  async login(req, res) {
    try {
      const { empresa_id, numero_registro, senha } = req.body;

      const colaborador = await Colaborador.findByRegistro(empresa_id, numero_registro);
      if (!colaborador) {
        return res.status(404).json({ success: false, message: 'Colaborador não encontrado' });
      }

      const senhaValida = await bcrypt.compare(senha, colaborador.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ success: false, message: 'Senha incorreta' });
      }

      const token = jwt.sign(
        { id: colaborador.id, empresa_id: colaborador.empresa_id, numero_registro: colaborador.numero_registro, tipo_usuario: 'colaborador' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({ success: true, message: 'Login realizado com sucesso', token });
    } catch (error) {
      console.error('Erro no login do colaborador:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Perfil do colaborador
  async getProfile(req, res) {
    try {
      const { id } = req.user;
      const colaborador = await Colaborador.findById(id);

      if (!colaborador) {
        return res.status(404).json({ success: false, message: 'Colaborador não encontrado' });
      }

      return res.json({ success: true, data: colaborador });
    } catch (error) {
      console.error('Erro ao buscar perfil do colaborador:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Atualizar dados do colaborador
  async update(req, res) {
    try {
      const { id } = req.user;
      const { nome, cargo, setor } = req.body;

      const atualizado = await Colaborador.update(id, { nome, cargo, setor });
      return res.json({ success: true, message: 'Colaborador atualizado com sucesso', data: atualizado });
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Deletar colaborador
  async delete(req, res) {
    try {
      const { id } = req.user;
      await Colaborador.delete(id);
      return res.json({ success: true, message: 'Colaborador deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar colaborador:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  }
};

module.exports = colaboradorController;
