// backend/routes/solicitacoesRoutes.js
const express = require('express');
const router = express.Router();

const solicitacoesController = require('../controllers/solicitacoesController');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

/**
 * Util helpers
 */
function warnIfNotFunction(name, fn) {
  if (typeof fn !== 'function') {
    console.warn(`AVISO: "${name}" não é uma função. Tipo atual: ${typeof fn}. Alguns endpoints podem falhar se esse método for necessário.`);
    return false;
  }
  return true;
}

console.log('DEBUG solicitacoesRoutes -> carregando middlewares e controller...');

/**
 * Verificações básicas (não lançam erro para não quebrar o servidor em runtime,
 * apenas logam avisos para facilitar debug).
 */
warnIfNotFunction('verificarToken', verificarToken);
warnIfNotFunction('autorizarTipoUsuario', autorizarTipoUsuario);

warnIfNotFunction('solicitacoesController.criar', solicitacoesController.criar);
warnIfNotFunction('solicitacoesController.listarMe', solicitacoesController.listarMe);
warnIfNotFunction('solicitacoesController.getById', solicitacoesController.getById);
warnIfNotFunction('solicitacoesController.atualizarStatus', solicitacoesController.atualizarStatus);
warnIfNotFunction('solicitacoesController.listarTodos', solicitacoesController.listarTodos);
warnIfNotFunction('solicitacoesController.adicionarAnexos', solicitacoesController.adicionarAnexos);
warnIfNotFunction('solicitacoesController.removerAnexo', solicitacoesController.removerAnexo);
warnIfNotFunction('solicitacoesController.atualizar', solicitacoesController.atualizar);
warnIfNotFunction('solicitacoesController.deletar', solicitacoesController.deletar);
warnIfNotFunction('solicitacoesController.serveAnexo', solicitacoesController.serveAnexo);

/**
 * Instanciar middleware de autorização para gestor de modo resiliente.
 * Tenta array primeiro, depois string. Se falhar, usa fallback que libera acesso
 * (é melhor logar do que travar o carregamento das rotas; ajuste conforme sua política).
 */
let gestorMiddleware = (req, res, next) => next();
try {
  if (typeof autorizarTipoUsuario === 'function') {
    try {
      gestorMiddleware = autorizarTipoUsuario(['gestor']);
      if (typeof gestorMiddleware !== 'function') throw new Error('retorno não é função');
    } catch (err) {
      // tentar com string
      gestorMiddleware = autorizarTipoUsuario('gestor');
      if (typeof gestorMiddleware !== 'function') throw new Error('retorno não é função');
    }
  } else {
    console.warn('autorizarTipoUsuario não disponível — usando fallback que libera acesso para rotas de gestor.');
  }
} catch (err) {
  console.warn('Falha instanciando autorizarTipoUsuario para "gestor":', err && err.message);
  gestorMiddleware = (req, res, next) => next();
}

/**
 * uploadMiddleware: preferir o middleware exportado pelo controller (config centralizada).
 * Se não existir, usar noop que chama next().
 */
const uploadMiddleware = (solicitacoesController && solicitacoesController.uploadMiddleware) || ((req, res, next) => next());

/**
 * ROTAS
 *
 * Ordem importante:
 * - rotas fixas/curtas (anexo, me, minhas, etc)
 * - rota raiz/listagem (GET '/')
 * - rotas com parâmetro (/:id) por último
 */

// Serve arquivo anexo (protegido). Rota curta para evitar conflito com /:id
router.get('/anexo/:filename', verificarToken, solicitacoesController.serveAnexo);

// Rotas para o próprio usuário (variações)
// GET /me, /minhas, /usuario -> listam solicitações do usuário autenticado
router.get('/me', verificarToken, solicitacoesController.listarMe);
router.get('/minhas', verificarToken, solicitacoesController.listarMe);
router.get('/usuario', verificarToken, solicitacoesController.listarMe);

// Criar solicitação (multipart/form-data)
// usa uploadMiddleware (pode aceitar campos 'anexo' ou 'anexos' conforme config do controller)
router.post(
  '/',
  verificarToken,
  uploadMiddleware,
  solicitacoesController.criar
);

// Adicionar anexos a solicitação existente
router.post(
  '/:id/anexos',
  verificarToken,
  uploadMiddleware,
  solicitacoesController.adicionarAnexos
);

// Remover anexo
router.delete(
  '/:id/anexos/:anexoId',
  verificarToken,
  solicitacoesController.removerAnexo
);

// Listar todas (gestor) - colocar antes de '/:id' para evitar conflitos
router.get('/', verificarToken, gestorMiddleware, solicitacoesController.listarTodos);

// Atualizar status (somente gestor)
// suportar PATCH e PUT por compatibilidade
router.patch('/:id/status', verificarToken, gestorMiddleware, solicitacoesController.atualizarStatus);
router.put('/:id/status', verificarToken, gestorMiddleware, solicitacoesController.atualizarStatus);

// Atualizar campos da solicitação (autor ou gestor)
router.patch('/:id', verificarToken, solicitacoesController.atualizar);

// Deletar solicitação (autor ou gestor)
router.delete('/:id', verificarToken, solicitacoesController.deletar);

// Buscar por id (detalhes) - rota por último para não conflitar com as anteriores
router.get('/:id', verificarToken, solicitacoesController.getById);

module.exports = router;
