const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Gestor = require('../models/gestorModel');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const gestorController = {
  // Registrar novo gestor
  async register(req, res) {
    try {
      const { empresa_id, numero_registro, nome, cnpj, senha, cargo, setor } = req.body;

      if (!empresa_id || !numero_registro || !nome || !cnpj || !senha) {
        return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios' });
      }

      const novoGestor = await Gestor.create({ empresa_id, numero_registro, nome, cnpj, senha, cargo, setor });
      return res.status(201).json({ success: true, message: 'Gestor registrado com sucesso', data: novoGestor });
    } catch (error) {
      console.error('Erro ao registrar gestor:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Login do gestor
  async login(req, res) {
    try {
      const { empresa_id, numero_registro, senha } = req.body;

      const gestor = await Gestor.findByRegistro(empresa_id, numero_registro);
      if (!gestor) {
        return res.status(404).json({ success: false, message: 'Gestor não encontrado' });
      }

      const senhaValida = await bcrypt.compare(senha, gestor.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ success: false, message: 'Senha incorreta' });
      }

      const token = jwt.sign(
        { id: gestor.id, empresa_id: gestor.empresa_id, numero_registro: gestor.numero_registro, tipo_usuario: 'gestor' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({ success: true, message: 'Login realizado com sucesso', token });
    } catch (error) {
      console.error('Erro no login do gestor:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Perfil do gestor
  async getProfile(req, res) {
    try {
      const { id } = req.user;
      const gestor = await Gestor.findById(id);

      if (!gestor) {
        return res.status(404).json({ success: false, message: 'Gestor não encontrado' });
      }

      return res.json({ success: true, data: gestor });
    } catch (error) {
      console.error('Erro ao buscar perfil do gestor:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Atualizar dados do gestor
  async update(req, res) {
    try {
      const { id } = req.user;
      const { nome, cargo, setor } = req.body;

      const atualizado = await Gestor.update(id, { nome, cargo, setor });
      return res.json({ success: true, message: 'Gestor atualizado com sucesso', data: atualizado });
    } catch (error) {
      console.error('Erro ao atualizar gestor:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Deletar gestor
  async delete(req, res) {
    try {
      const { id } = req.user;
      await Gestor.delete(id);
      return res.json({ success: true, message: 'Gestor deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar gestor:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  }
};

module.exports = gestorController;
