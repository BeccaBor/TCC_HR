// backend/controllers/solicitacoesController.js
const SolicitacaoModel = require('../models/solicitacoesModel');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const ALLOWED_TIPOS = [
  'ferias','alteracao_dados','consulta_banco_horas','banco_horas',
  'desligamento','reembolso','outros','reajuste_salarial'
];

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(__dirname, '..', 'uploads');

// garante pasta de uploads
try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  console.error('Falha criando uploads dir:', UPLOADS_DIR, e);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safe = (file.originalname || 'anexo')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\.\-]/g, '');
    cb(null, `${timestamp}_${safe}`);
  }
});

function fileFilter(req, file, cb) {
  const allowedRegex = /\.(pdf|jpe?g|png|gif)$/i;
  const original = file.originalname || '';
  if (!allowedRegex.test(original)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Tipo de arquivo não permitido. Permitidos: pdf, jpg, jpeg, png, gif'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: (process.env.MAX_UPLOAD_MB ? Number(process.env.MAX_UPLOAD_MB) : 8) * 1024 * 1024 },
  fileFilter
});

const uploadMiddleware = upload.fields([{ name: 'anexo', maxCount: 1 }, { name: 'anexos', maxCount: 8 }]);

function extractUserFromReq(req) {
  if (!req) return null;
  if (req.usuario && req.usuario.id) return req.usuario;
  if (req.user && req.user.id) return req.user;

  try {
    const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'troque_essa_chave_em_producao');
      if (payload && (payload.id || payload.sub)) {
        return { id: payload.id || payload.sub, ...payload };
      }
      return payload;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

function isGestor(user) {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  if (role === 'gestor' || role === 'admin' || role === 'manager') return true;
  if (Array.isArray(user.roles) && user.roles.some(r => ['gestor','admin','manager'].includes(String(r).toLowerCase()))) return true;
  if (Array.isArray(user.papeis) && user.papeis.some(r => ['gestor','admin','manager'].includes(String(r).toLowerCase()))) return true;
  return false;
}

function buildAnexosFromFiles(filesArray) {
  return (filesArray || []).map(f => {
    return {
      original_name: f.originalname || f.filename || '',
      filename: path.basename(f.filename || f.path || ''),
      mime: f.mimetype || '',
      size: f.size || 0,
      url: `/uploads/${path.basename(f.filename || f.path || '')}`,
      path: path.relative(process.cwd(), f.path || '') // opcional
    };
  });
}

function tryUnlink(fileFullPath) {
  try {
    if (fs.existsSync(fileFullPath)) fs.unlinkSync(fileFullPath);
    return true;
  } catch (err) {
    console.warn('Falha ao remover arquivo:', fileFullPath, err);
    return false;
  }
}

const controller = {
  uploadMiddleware,

  async criar(req, res) {
    try {
      const user = extractUserFromReq(req);
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

      let tipo_solicitacao = (req.body && (req.body.tipo_solicitacao || req.body.tipo || '')).toString().trim();
      if (tipo_solicitacao === 'banco_horas') tipo_solicitacao = 'consulta_banco_horas';
      if (!tipo_solicitacao || !ALLOWED_TIPOS.includes(tipo_solicitacao)) {
        return res.status(400).json({ success: false, message: 'Tipo de solicitação inválido' });
      }

      const titulo = req.body.titulo || req.body.title || null;
      const descricaoRaw = req.body.descricao || req.body.descricao_text || req.body.observacao || req.body.description || null;
      const descricao = (typeof descricaoRaw === 'string' && descricaoRaw.trim().length) ? descricaoRaw.trim() : null;
      const data_inicio = req.body.data_inicio || req.body.periodo_inicio || null;
      const data_fim = req.body.data_fim || req.body.periodo_fim || null;

      // coleta arquivos enviados
      let uploaded = [];
      if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
        Object.keys(req.files).forEach(k => {
          const entry = req.files[k];
          if (Array.isArray(entry)) uploaded = uploaded.concat(entry);
          else if (entry) uploaded.push(entry);
        });
      } else if (Array.isArray(req.files) && req.files.length) {
        uploaded = req.files;
      } else if (req.file) {
        uploaded = [req.file];
      }

      const anexos = buildAnexosFromFiles(uploaded);

      const payload = {
        usuario_id: user.id,
        tipo_solicitacao,
        titulo,
        descricao,
        data_inicio: data_inicio || null,
        data_fim: data_fim || null,
        anexos
      };

      // Criar solicitação via model (model determina gestor_id)
      const created = await SolicitacaoModel.criar(payload);

      // garantir anexos persistidos (modelo já tenta inserir, mas caso model retorne id e não tenha inserido, chamar adicionarAnexos)
      if (anexos.length && created && (created.id || created.insertId)) {
        const solicitacaoId = created.id || created.insertId || created.solicitacao_id;
        // tentar recuperar anexos do model - se não houver, forçar adicionar
        try {
          const saved = await SolicitacaoModel.buscarPorId(solicitacaoId);
          if ((!saved.anexos || saved.anexos.length === 0) && typeof SolicitacaoModel.adicionarAnexos === 'function') {
            await SolicitacaoModel.adicionarAnexos(solicitacaoId, anexos);
          }
        } catch (err) {
          console.warn('Verificação pós-criar/anexos falhou:', err);
        }
      }

      // retornar solicitação completa (fresh)
      const solicitacaoFinal = (created && (created.id || created.insertId))
        ? await SolicitacaoModel.buscarPorId(created.id || created.insertId)
        : created;

      return res.status(201).json({ success: true, data: solicitacaoFinal || created });
    } catch (err) {
      console.error('Erro em solicitacoesController.criar:', err);
      return res.status(500).json({ success: false, message: 'Erro ao criar solicitação', detalhe: err && err.message });
    }
  },

  async listarMe(req, res) {
    try {
      const user = extractUserFromReq(req);
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });

      const limit = parseInt(req.query.limit || '100', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const q = req.query.q || undefined;

      const opts = {
        colaborador: user.id,
        q,
        limit,
        offset
      };

      const result = await SolicitacaoModel.listarTodos(opts);
      return res.json({ success: true, total: result.total, solicitacoes: result.rows });
    } catch (err) {
      console.error('Erro em solicitacoesController.listarMe:', err);
      return res.status(500).json({ success: false, message: 'Erro ao listar suas solicitações' });
    }
  },

  async listarTodos(req, res) {
    try {
      const user = extractUserFromReq(req);
      if (!user || !isGestor(user)) {
        return res.status(403).json({ success: false, message: 'Acesso negado: requer papel gestor' });
      }

      const opts = {
        status: req.query.status || undefined,
        setor: req.query.setor || undefined,
        colaborador: req.query.colaborador || undefined,
        q: req.query.q || undefined,
        limit: parseInt(req.query.limit || '100', 10),
        offset: parseInt(req.query.offset || '0', 10),
        order: req.query.order || 'r.created_at DESC',
        gestor_id: user.id // filtrar por gestor do usuário autenticado
      };

      const result = await SolicitacaoModel.listarTodos(opts);
      return res.json({ success: true, total: result.total, solicitacoes: result.rows });
    } catch (err) {
      console.error('Erro em solicitacoesController.listarTodos:', err);
      return res.status(500).json({ success: false, message: 'Erro ao listar solicitações' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: 'ID obrigatório' });
      const item = await SolicitacaoModel.buscarPorId(id);
      if (!item) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
      return res.json({ success: true, solicitacao: item });
    } catch (err) {
      console.error('Erro em solicitacoesController.getById:', err);
      return res.status(500).json({ success: false, message: 'Erro ao buscar solicitação' });
    }
  },

  async atualizarStatus(req, res) {
    try {
      const user = extractUserFromReq(req);
      if (!user || !isGestor(user)) return res.status(403).json({ success: false, message: 'Acesso negado' });

      const { id } = req.params;
      const { status, observacao } = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'ID obrigatório' });
      if (!status) return res.status(400).json({ success: false, message: 'Status obrigatório' });

      const allowed = ['aprovada', 'reprovada', 'pendente'];
      if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Status inválido' });

      const result = await SolicitacaoModel.atualizarStatus(id, status, observacao || null, user.id);
      if (result && (result.affectedRows || result.rowCount || result.changedRows)) {
        return res.json({ success: true, message: 'Status atualizado' });
      } else {
        return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });
      }
    } catch (err) {
      console.error('Erro em solicitacoesController.atualizarStatus:', err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
    }
  },

  async adicionarAnexos(req, res) {
    try {
      const user = extractUserFromReq(req);
      const { id } = req.params;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (!id) return res.status(400).json({ success: false, message: 'ID obrigatório' });

      const solicitacao = await SolicitacaoModel.buscarPorId(id);
      if (!solicitacao) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });

      const isOwner = String(solicitacao.usuario_id) === String(user.id);
      if (!isOwner && !isGestor(user)) return res.status(403).json({ success: false, message: 'Permissão negada para anexar' });

      let uploaded = [];
      if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
        Object.keys(req.files).forEach(k => {
          const entry = req.files[k];
          if (Array.isArray(entry)) uploaded = uploaded.concat(entry);
          else if (entry) uploaded.push(entry);
        });
      } else if (Array.isArray(req.files) && req.files.length) {
        uploaded = req.files;
      } else if (req.file) {
        uploaded = [req.file];
      }

      if (!uploaded.length) return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });

      const anexos = buildAnexosFromFiles(uploaded);

      if (typeof SolicitacaoModel.adicionarAnexos === 'function') {
        const inserted = await SolicitacaoModel.adicionarAnexos(id, anexos);
        return res.json({ success: true, message: 'Anexos adicionados', anexos: inserted });
      } else {
        // fallback
        try {
          const current = await SolicitacaoModel.buscarPorId(id);
          const novos = (current.anexos || []).concat(anexos);
          if (typeof SolicitacaoModel.atualizar === 'function') {
            await SolicitacaoModel.atualizar(id, { anexos: novos });
          }
        } catch (err) {
          console.warn('Fallback adicionarAnexos falhou:', err);
        }
        return res.json({ success: true, message: 'Anexos adicionados (fallback)', anexos });
      }
    } catch (err) {
      console.error('Erro em solicitacoesController.adicionarAnexos:', err);
      return res.status(500).json({ success: false, message: 'Erro ao adicionar anexos' });
    }
  },

  async removerAnexo(req, res) {
    try {
      const user = extractUserFromReq(req);
      const { id, anexoId } = req.params;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (!id || !anexoId) return res.status(400).json({ success: false, message: 'ID da solicitação e do anexo são obrigatórios' });

      const solicitacao = await SolicitacaoModel.buscarPorId(id);
      if (!solicitacao) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });

      const isOwner = String(solicitacao.usuario_id) === String(user.id);
      if (!isOwner && !isGestor(user)) return res.status(403).json({ success: false, message: 'Permissão negada para remover anexo' });

      let anexoMeta = null;
      if (typeof SolicitacaoModel.buscarAnexoPorId === 'function') {
        anexoMeta = await SolicitacaoModel.buscarAnexoPorId(anexoId);
      } else {
        (solicitacao.anexos || []).forEach(a => {
          if (String(a.id || a.anexoId || a.filename) === String(anexoId)) anexoMeta = a;
        });
      }

      if (!anexoMeta) {
        return res.status(404).json({ success: false, message: 'Anexo não encontrado' });
      }

      if (typeof SolicitacaoModel.removerAnexo === 'function') {
        const removed = await SolicitacaoModel.removerAnexo(id, anexoId);
        // remover arquivo do disco
        const filename = removed.filename || path.basename((removed.url || removed.path || '').toString());
        const full = path.join(UPLOADS_DIR, filename);
        tryUnlink(full);
        return res.json({ success: true, message: 'Anexo removido', anexo: removed });
      } else {
        // fallback
        try {
          const novos = (solicitacao.anexos || []).filter(a => String(a.id || a.filename || a.url) !== String(anexoId));
          if (typeof SolicitacaoModel.atualizar === 'function') {
            await SolicitacaoModel.atualizar(id, { anexos: novos });
          }
        } catch (err) {
          console.warn('Fallback removerAnexo falhou:', err);
        }
        // try unlink anyway
        const filename = anexoMeta.filename || path.basename((anexoMeta.url || anexoMeta.path || '').toString());
        const full = path.join(UPLOADS_DIR, filename);
        tryUnlink(full);
        return res.json({ success: true, message: 'Anexo removido (fallback)' });
      }
    } catch (err) {
      console.error('Erro em solicitacoesController.removerAnexo:', err);
      return res.status(500).json({ success: false, message: 'Erro ao remover anexo' });
    }
  },

  async serveAnexo(req, res) {
    try {
      const { filename } = req.params;
      if (!filename) return res.status(400).send('Filename obrigatório');
      const full = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(full)) return res.status(404).send('Not found');
      return res.sendFile(full);
    } catch (err) {
      console.error('Erro em solicitacoesController.serveAnexo:', err);
      return res.status(500).send('Erro');
    }
  },

  async atualizar(req, res) {
    try {
      const user = extractUserFromReq(req);
      const { id } = req.params;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (!id) return res.status(400).json({ success: false, message: 'ID obrigatório' });

      const solicitacao = await SolicitacaoModel.buscarPorId(id);
      if (!solicitacao) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });

      const isOwner = String(solicitacao.usuario_id) === String(user.id);
      if (!isOwner && !isGestor(user)) return res.status(403).json({ success: false, message: 'Permissão negada para atualizar' });

      const allowedFields = ['titulo', 'descricao', 'data_inicio', 'data_fim'];
      const payload = {};
      for (const f of allowedFields) {
        if (typeof req.body[f] !== 'undefined') payload[f] = req.body[f];
      }
      if (Object.keys(payload).length === 0) return res.status(400).json({ success: false, message: 'Nenhum campo para atualizar' });

      if (typeof SolicitacaoModel.atualizar === 'function') {
        const result = await SolicitacaoModel.atualizar(id, payload);
        return res.json({ success: true, message: 'Solicitação atualizada', result });
      } else {
        return res.status(500).json({ success: false, message: 'Modelo não implementa atualização' });
      }
    } catch (err) {
      console.error('Erro em solicitacoesController.atualizar:', err);
      return res.status(500).json({ success: false, message: 'Erro ao atualizar solicitação' });
    }
  },
async atualizarStatus(req, res) {
  try {
    const user = extractUserFromReq(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!user || !isGestor(user))
      return res.status(403).json({ success: false, message: 'Apenas gestores podem alterar status.' });
    if (!id || !status)
      return res.status(400).json({ success: false, message: 'ID e status são obrigatórios.' });

    const solicitacao = await SolicitacaoModel.buscarPorId(id);
    if (!solicitacao)
      return res.status(404).json({ success: false, message: 'Solicitação não encontrada.' });

    const result = await SolicitacaoModel.atualizar(id, { status });
    return res.json({ success: true, message: 'Status atualizado', result });
  } catch (err) {
    console.error('Erro em atualizarStatus:', err);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
  }
},

  async deletar(req, res) {
    try {
      const user = extractUserFromReq(req);
      const { id } = req.params;
      if (!user || !user.id) return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      if (!id) return res.status(400).json({ success: false, message: 'ID obrigatório' });

      const solicitacao = await SolicitacaoModel.buscarPorId(id);
      if (!solicitacao) return res.status(404).json({ success: false, message: 'Solicitação não encontrada' });

      const isOwner = String(solicitacao.usuario_id) === String(user.id);
      if (!isOwner && !isGestor(user)) return res.status(403).json({ success: false, message: 'Permissão negada para deletar' });

      const anexos = solicitacao.anexos || [];
      if (anexos.length) {
        for (const a of anexos) {
          const filename = a.filename || path.basename((a.url || a.path || '').toString());
          const full = path.join(UPLOADS_DIR, filename);
          tryUnlink(full);
        }
      }

      if (typeof SolicitacaoModel.deletar === 'function') {
        await SolicitacaoModel.deletar(id);
      } else {
        return res.status(500).json({ success: false, message: 'Modelo não implementa deleção' });
      }

      return res.json({ success: true, message: 'Solicitação deletada' });
    } catch (err) {
      console.error('Erro em solicitacoesController.deletar:', err);
      return res.status(500).json({ success: false, message: 'Erro ao deletar solicitação' });
    }
  }

};

module.exports = controller;
