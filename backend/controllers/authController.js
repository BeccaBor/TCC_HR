// backend/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'troque_essa_chave_em_producao';
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const TOKEN_EXPIRES = process.env.TOKEN_EXPIRES || '8h';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ AVISO: JWT_SECRET não está definida. Use uma chave segura em produção.');
}

function montarPayloadUsuario(usuarioRow) {
  return {
    id: usuarioRow.id,
    empresa_id: usuarioRow.empresa_id,
    tipo_usuario: (usuarioRow.tipo_usuario || usuarioRow.tipo || '').toString().trim().toLowerCase(),
    nome: usuarioRow.nome,
    numero_registro: usuarioRow.numero_registro,
    cnpj: usuarioRow.cnpj || null,
    cargo: usuarioRow.cargo || null,
    setor: usuarioRow.setor || null,
    foto: usuarioRow.foto || null
  };
}

async function login(req, res) {
  try {
    const { cnpj, registro, senha, numero_registro } = req.body;
    const reg = registro || numero_registro;
    if (!reg || !senha) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios: registro e senha' });
    }

    let query = `SELECT id, empresa_id, numero_registro, nome, cnpj, tipo_usuario, senha_hash, cargo, setor, horas_diarias, tipo_jornada, foto
                 FROM usuario WHERE numero_registro = ?`;
    const params = [reg];

    if (cnpj) {
      query += ' AND cnpj = ? LIMIT 1';
      params.push(cnpj);
    } else {
      query += ' LIMIT 1';
    }

    const [rows] = await db.query(query, params);
    const usuario = Array.isArray(rows) && rows[0] ? rows[0] : null;

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Registro ou senha incorretos' });
    }

    const senhaHash = usuario.senha_hash || usuario.senha || null;
    if (!senhaHash) {
      console.warn('Usuário sem senha_hash no banco:', usuario.id);
      return res.status(500).json({ success: false, message: 'Conta inválida no servidor' });
    }

    const senhaValida = await bcrypt.compare(senha, senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ success: false, message: 'Registro ou senha incorretos' });
    }

    const payloadUsuario = montarPayloadUsuario(usuario);
    const token = jwt.sign(payloadUsuario, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

    // set cookie HttpOnly (dev/prod aware)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    });

    // resposta consistente
    return res.json({ success: true, token, usuario: payloadUsuario });
  } catch (err) {
    console.error('❌ authController.login:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no login' });
  }
}

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
      setor = null,
      tipo_jornada = '6x1',
      horas_diarias = 8
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
    if (Array.isArray(exist) && exist.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Número de registro já cadastrado para este CNPJ'
      });
    }

    const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);

    const q = `INSERT INTO usuario 
      (empresa_id, numero_registro, nome, cnpj, senha_hash, tipo_usuario, cargo, setor, tipo_jornada, horas_diarias)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      empresa_id,
      numero_registro,
      nome,
      cnpj,
      senha_hash,
      (tipo_usuario || 'colaborador').toString().trim().toLowerCase(),
      cargo,
      setor,
      tipo_jornada,
      horas_diarias
    ];

    const [result] = await db.query(q, params);

    return res.status(201).json({ success: true, id: result.insertId, message: 'Usuário cadastrado com sucesso' });
  } catch (err) {
    console.error('❌ authController.register:', err);
    return res.status(500).json({ success: false, message: 'Erro interno ao cadastrar usuário' });
  }
}

async function me(req, res) {
  try {
    // middleware agora popula req.user e req.usuario (verifique seu authMiddleware)
    const userFromMiddleware = req.usuario || req.user;
    if (!userFromMiddleware || !userFromMiddleware.id) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }

    const [rows] = await db.query(
      `SELECT id, empresa_id, numero_registro, nome, cnpj, tipo_usuario, cargo, setor, salario, tipo_jornada, horas_diarias, foto
       FROM usuario WHERE id = ? LIMIT 1`,
      [userFromMiddleware.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    const usuario = rows[0];
    usuario.tipo_usuario = (usuario.tipo_usuario || '').toString().trim().toLowerCase();

    return res.json({ success: true, usuario });
  } catch (err) {
    console.error('❌ authController.me:', err);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
}

async function logout(req, res) {
  try {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    return res.json({ success: true, message: 'Logout realizado' });
  } catch (err) {
    console.error('❌ authController.logout:', err);
    return res.status(500).json({ success: false, message: 'Erro no logout' });
  }
}

module.exports = { login, register, me, logout };
