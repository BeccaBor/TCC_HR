const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

if (!JWT_SECRET) {
  console.warn('⚠️ AVISO: JWT_SECRET não está definida. Tokens não serão seguros.');
}

// --- LOGIN ---
async function login(req, res) {
  try {
    const { cnpj, registro, senha } = req.body;

    if (!registro || !senha || !cnpj) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: CNPJ, registro, senha'
      });
    }

    const [rows] = await db.query(
      `SELECT id, empresa_id, numero_registro, nome, cnpj, tipo_usuario, senha_hash 
       FROM usuario 
       WHERE numero_registro = ? AND cnpj = ? 
       LIMIT 1`,
      [registro, cnpj]
    );

    const usuario = rows && rows[0];
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Registro, CNPJ ou senha incorretos'
      });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Registro, CNPJ ou senha incorretos'
      });
    }

    const payload = {
      id: usuario.id,
      empresa_id: usuario.empresa_id,
      tipo_usuario: usuario.tipo_usuario?.trim().toLowerCase(),
      nome: usuario.nome,
      numero_registro: usuario.numero_registro
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    // Envia token também em cookie HTTP Only
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 🔒 só HTTPS em produção
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    return res.json({ success: true, token, usuario: payload });
  } catch (err) {
    console.error('Erro em authController.login:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no login' });
  }
}

// --- REGISTRO ---
async function register(req, res) {
  try {
    const {
      empresa_id = null,
      numero_registro,
      nome,
      cnpj,
      senha,
      tipo_usuario = 'colaborador',
      cargo = null,
      setor = null
    } = req.body;

    if (!numero_registro || !nome || !senha || !cnpj) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: numero_registro, nome, CNPJ, senha'
      });
    }

    const [exist] = await db.query(
      'SELECT id FROM usuario WHERE numero_registro = ? AND cnpj = ? LIMIT 1',
      [numero_registro, cnpj]
    );
    if (exist.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Número de registro já cadastrado para este CNPJ'
      });
    }

    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const q = `INSERT INTO usuario 
      (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      empresa_id,
      numero_registro,
      nome,
      cnpj,
      senha_hash,
      tipo_usuario.trim().toLowerCase(),
      cargo,
      setor
    ];

    const [result] = await db.query(q, params);

    return res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Usuário cadastrado com sucesso'
    });
  } catch (err) {
    console.error('Erro em authController.register:', err);
    return res.status(500).json({ success: false, message: 'Erro interno ao cadastrar usuário' });
  }
}

// --- DADOS DO USUÁRIO LOGADO ---
async function me(req, res) {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    const [rows] = await db.query(
      `SELECT id, empresa_id, numero_registro, nome, cnpj, tipo_usuario, cargo, setor 
       FROM usuario 
       WHERE id = ? 
       LIMIT 1`,
      [req.usuario.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const usuario = rows[0];
    usuario.tipo_usuario = usuario.tipo_usuario?.trim().toLowerCase();

    return res.json({ success: true, usuario });
  } catch (err) {
    console.error('Erro em authController.me:', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
}

module.exports = { login, register, me };
