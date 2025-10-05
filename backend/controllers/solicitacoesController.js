// backend/controllers/solicitacoesController.js
const SolicitacaoModel = require('../models/solicitacoesModel');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'troque_essa_chave_em_producao';

// Extrai usuário do req (suporta req.usuario, req.user ou token JWT em header/cookie/query)
function extractUserFromReq(req) {
  if (!req) return null;
  if (req.usuario && req.usuario.id) return req.usuario;
  if (req.user && req.user.id) return req.user;

  try {
    let token = null;
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (authHeader) {
      const parts = String(authHeader).split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') token = parts[1];
      else token = parts[0];
    }
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token && req.query && req.query.token) token = req.query.token;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

// Normaliza dados vindos de req.body (aceita JSON string em campos textarea/multipart)
function extractField(body, ...names) {
  if (!body) return null;
  for (const n of names) {
    if (body[n] !== undefined && body[n] !== null && body[n] !== '') return body[n];
    // suporte para payloads onde body[n] venha stringified JSON
    if (typeof body[n] === 'string') {
      const trimmed = body[n].trim();
      if (trimmed) return trimmed;
    }
  }
  return null;
}

const controller = {
  async criar(req, res) {
    try {
      console.log('--- solicitacoesController.criar RECEIVED ---');
      // logs mínimos para debug (remova em produção)
      console.log('headers.authorization:', req.headers && (req.headers.authorization || req.headers.Authorization));
      console.log('body (keys):', req.body ? Object.keys(req.body) : null);
      console.log('file:', req.file ? { fieldname: req.file.fieldname, originalname: req.file.originalname, filename: req.file.filename, size: req.file.size } : null);
      console.log('files:', req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files)) : null);

      const usuario = extractUserFromReq(req);
      if (!usuario || !usuario.id) {
        return res.status(401).json({ success: false, message: 'Não autenticado: token ausente ou inválido' });
      }

      // Se body veio como JSON string dentro de um campo (caso incomum), tenta parseá-lo
      let body = req.body || {};
      // Em alguns setups com multer os campos podem vir como strings; ficam como está.

      // Tipo obrigatório (front envia 'tipo' como hidden)
      const tipo = (extractField(body, 'tipo', 'tipo_solicitacao') || '').toString().trim();
      if (!tipo) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitação é obrigatório' });
      }

      // Campos opcionais com fallback
      const descricao = extractField(body, 'descricao', 'observacao', 'observacao_gestor') || null;
      const titulo = extractField(body, 'titulo', 'titulo_solicitacao') || (tipo ? `Solicitação - ${tipo}` : null);

      // Datas se existirem (algumas forms enviam período_inicio / data_inicio; modelo atual da tabela não tem colunas para essas datas,
      // então se você quiser persistir data_inicio / data_fim, adicione colunas na tabela e no model.criar)
      const data_inicio = extractField(body, 'data_inicio', 'periodo_inicio') || null;
      const data_fim = extractField(body, 'data_fim', 'periodo_fim') || null;

      // tratar anexo(s)
      let anexo_nome = null;
      let anexo_path = null;
      // Se multer single -> req.file ; se multer.array -> req.files (array)
      if (req.file && req.file.filename) {
        anexo_nome = req.file.originalname || req.file.filename;
        anexo_path = path.posix.join('/uploads', req.file.filename);
      } else if (req.files) {
        // se vier array
        if (Array.isArray(req.files) && req.files.length > 0) {
          // guardamos o primeiro como exemplo (ou implemente salvar múltiplos em outra tabela)
          const f = req.files[0];
          anexo_nome = f.originalname || f.filename;
          anexo_path = path.posix.join('/uploads', f.filename);
        } else if (typeof req.files === 'object') {
          // multer.fields -> objeto com chaves
          const firstKey = Object.keys(req.files)[0];
          const f = req.files[firstKey] && req.files[firstKey][0];
          if (f) {
            anexo_nome = f.originalname || f.filename;
            anexo_path = path.posix.join('/uploads', f.filename);
          }
        }
      } else if (body.anexo_path) {
        // caso o front já envie path (fallback)
        anexo_path = body.anexo_path;
      }

      const payload = {
        usuario_id: usuario.id,
        tipo_solicitacao: tipo,
        descricao,
        titulo,
        anexo_nome,
        anexo_path,
        // se quiser persistir data_inicio/data_fim, descomente abaixo e atualize model.criar e tabela
        // data_inicio, data_fim
      };

      const created = await SolicitacaoModel.criar(payload);

      // identificar insertId de forma robusta
      const insertId = (created && (created.insertId || created.insert_id || created.insertedId)) || null;

      return res.status(201).json({ success: true, message: 'Solicitação criada', id: insertId, anexo: anexo_path });
    } catch (err) {
      console.error('Erro em solicitacoesController.criar:', err && (err.message || err));
      const msg = err && err.message ? err.message : 'Erro ao criar solicitação';
      return res.status(500).json({ success: false, message: msg });
    }
  },

  async listarMe(req, res) {
    try {
      const usuario = extractUserFromReq(req);
      if (!usuario || !usuario.id) return res.status(401).json({ success: false, message: 'Não autenticado' });

      const items = await SolicitacaoModel.listarPorUsuario(usuario.id);
      return res.json(items);
    } catch (err) {
      console.error('Erro em solicitacoesController.listarMe:', err);
      return res.status(500).json({ success: false, message: 'Erro ao listar solicitações' });
    }
  },

  async listarTodos(req, res) {
    try {
      const items = await SolicitacaoModel.listarTodos();
      return res.json(items);
    } catch (err) {
      console.error('Erro em solicitacoesController.listarTodos:', err);
      return res.status(500).json({ success: false, message: 'Erro ao listar solicitações' });
    }
  },

  async atualizarStatus(req, res) {
    try {
      const usuario = extractUserFromReq(req);
      if (!usuario || !usuario.id) return res.status(401).json({ success: false, message: 'Não autenticado' });

      const { id } = req.params;
      const { status, observacao } = req.body;
      if (!id || !status) return res.status(400).json({ success: false, message: 'ID e novo status são obrigatórios' });

      await SolicitacaoModel.atualizarStatus(id, status, usuario.id, observacao || null);
      return res.json({ success: true, message: 'Status atualizado' });
    } catch (err) {
      console.error('Erro em solicitacoesController.atualizarStatus:', err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: 'ID obrigatório' });
      const item = await SolicitacaoModel.buscarPorId(id);
      if (!item) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
      return res.json(item);
    } catch (err) {
      console.error('Erro em solicitacoesController.getById:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar solicitação' });
    }
  }
};

module.exports = controller;
