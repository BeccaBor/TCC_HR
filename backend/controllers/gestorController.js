// backend/controllers/gestorController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Gestor = require('../models/gestorModel'); // Use a versão corrigida do gestorModel.js (da resposta anterior)
const { me } = require('./authController');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const gestorController = {
  // Registrar novo gestor (sem alterações principais, mas com logs opcionais)
 // backend/controllers/gestorController.js

async register(req, res) {
  try {
    const { 
      empresa_id, 
      numero_registro, 
      nome, 
      cnpj, 
      senha, 
      cargo, 
      setor,
      tipo_jornada,      // NOVO
      horas_diarias      // NOVO
    } = req.body;

    if (!empresa_id || !numero_registro || !nome || !cnpj || !senha || !tipo_jornada || !horas_diarias) {
      return res.status(400).json({ success: false, message: 'Preencha todos os campos obrigatórios' });
    }

    console.log('Registrando novo gestor:', { empresa_id, numero_registro, nome, tipo_jornada, horas_diarias });

    const novoGestor = await Gestor.create({ 
      empresa_id, 
      numero_registro, 
      nome, 
      cnpj, 
      senha, 
      cargo, 
      setor,
      tipo_jornada, 
      horas_diarias
    });

    return res.status(201).json({ success: true, message: 'Gestor registrado com sucesso', data: novoGestor });
  } catch (error) {
    console.error('Erro ao registrar gestor:', error);
    return res.status(500).json({ success: false, message: error.message || 'Erro interno no servidor' });
  }
},
  // Login do gestor (sem alterações principais)
  async login(req, res) {
    try {
      const { empresa_id, numero_registro, senha } = req.body;

      console.log('Tentativa de login do gestor:', { empresa_id, numero_registro }); // LOG para depuração (opcional)

      const gestor = await Gestor.findByRegistro(empresa_id, numero_registro);
      if (!gestor) {
        return res.status(404).json({ success: false, message: 'Gestor não encontrado' });
      }

      const senhaValida = await bcrypt.compare(senha, gestor.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ success: false, message: 'Senha incorreta' });
      }

      const token = jwt.sign(
        { 
          id: gestor.id, 
          empresa_id: gestor.empresa_id, 
          numero_registro: gestor.numero_registro, 
          tipo_usuario: 'gestor' // Garante lowercase para o middleware
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      console.log('Login bem-sucedido para gestor ID:', gestor.id); // LOG
      return res.json({ success: true, message: 'Login realizado com sucesso', token });
    } catch (error) {
      console.error('Erro no login do gestor:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Perfil do gestor (CORRIGIDO: req.user → req.usuario; adicionado default para setor e logs)
  async getProfile(req, res) {
    try {
      console.log('getProfile chamado. req.usuario:', req.usuario); // LOG para depuração

      const usuarioId = req.usuario?.id; // CORRIGIDO: Usa req.usuario.id
      if (!usuarioId) {
        console.warn('ID do usuário não encontrado em req.usuario'); // LOG
        return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      }

      const gestor = await Gestor.findById(usuarioId);
      if (!gestor) {
        console.warn('Gestor não encontrado no banco para ID:', usuarioId); // LOG
        return res.status(404).json({ success: false, message: 'Gestor não encontrado' });
      }

      // Adicionado: Default para setor se for gestor e null (similar ao pontoController)
      if (gestor.tipo_usuario === 'gestor' && !gestor.setor) {
        gestor.setor = 'Departamento Pessoal';
        console.log('Setor default definido para gestor:', gestor.setor); // LOG
      }

      // Garante lowercase no tipo_usuario para consistência
      gestor.tipo_usuario = gestor.tipo_usuario?.toLowerCase();

      console.log('Perfil do gestor retornado:', gestor); // LOG
      return res.json({ success: true, data: gestor });
    } catch (error) {
      console.error('Erro ao buscar perfil do gestor:', error);
      return res.status(500).json({ success: false, message: 'Erro interno no servidor' });
    }
  },

  // Atualizar dados do gestor (CORRIGIDO: req.user → req.usuario; adicionado verificação e logs)
  async update(req, res) {
    try {
      const usuarioId = req.usuario?.id; // CORRIGIDO: Usa req.usuario.id
      if (!usuarioId) {
        console.warn('ID do usuário não encontrado em req.usuario'); // LOG
        return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      }

      const { nome, cargo, setor } = req.body;

      if (!nome && !cargo && !setor) {
        return res.status(400).json({ success: false, message: 'Forneça pelo menos um campo para atualizar' });
      }

      console.log('Atualizando gestor ID:', usuarioId, 'com dados:', { nome, cargo, setor }); // LOG

      const atualizado = await Gestor.update(usuarioId, { nome, cargo, setor });
      return res.json({ success: true, message: 'Gestor atualizado com sucesso', data: atualizado });
    } catch (error) {
      console.error('Erro ao atualizar gestor:', error);
      return res.status(500).json({ success: false, message: error.message || 'Erro interno no servidor' });
    }
  },

  // Deletar gestor (CORRIGIDO: req.user → req.usuario; adicionado verificação e logs)
  async delete(req, res) {
    try {
      const usuarioId = req.usuario?.id; // CORRIGIDO: Usa req.usuario.id
      if (!usuarioId) {
        console.warn('ID do usuário não encontrado em req.usuario'); // LOG
        return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      }

      console.log('Deletando gestor ID:', usuarioId); // LOG

      await Gestor.delete(usuarioId);
      return res.json({ success: true, message: 'Gestor deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar gestor:', error);
      return res.status(500).json({ success: false, message: error.message || 'Erro interno no servidor' });
    }
  },
   async me(req, res) {
    try {
      const usuario = req.usuario;
      if (!usuario) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return res.json({ success: true, usuario });
    } catch (err) {
      console.error('Erro em /gestor/me:', err);
      res.status(500).json({ success: false, message: 'Erro ao buscar dados do gestor' });
    }
  }
};



module.exports = gestorController;