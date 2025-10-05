// backend/routes/colaboradorRoutes.js
const express = require('express');
const router = express.Router();
const colaboradorController = require('../controllers/colaboradorController');
const authController = require('../controllers/authController');
const Colaborador = require('../models/colaboradorModel');
const multer = require('multer');
const path = require('path');
const { verificarToken, autorizarTipoUsuario } = require('../middlewares/authMiddleware');

/**
 * Rotas de VIEW (pages) - montadas em /colaborador (no index.js)
 * Ajuste das renderizações para usar os nomes reais dos templates.
 */

// Página: ponto do colaborador
router.get('/pontoColaborador', verificarToken, autorizarTipoUsuario(['colaborador']), (req, res) => {
  return res.render('colaborador/pontoColaborador', { title: 'Meu Ponto', usuario: req.usuario });
});

// Página inicial/dados do colaborador (rota usada na navbar: /colaborador/dados)
// OBS: o template chama-se 'dados.handlebars' — por isso renderizamos 'colaborador/dados'
router.get('/dados', verificarToken, autorizarTipoUsuario(['colaborador']), (req, res) => {
  return res.render('colaborador/dados', { title: 'Meus Dados', usuario: req.usuario });
});

// Compat: '/meusDados' redireciona para '/colaborador/dados'
router.get('/meusDados', (req, res) => res.redirect('/colaborador/dados'));

// Documentação (navbar)
router.get('/documentacaoCola', verificarToken, autorizarTipoUsuario(['colaborador']), (req, res) => {
  return res.render('colaborador/documentacaoCola', { title: 'Documentação', usuario: req.usuario });
});
// Solicitações (navbar)
router.get('/solicitacoesCola', verificarToken, autorizarTipoUsuario(['colaborador']), (req, res) => {
  return res.render('colaborador/solicitacoesCola', { title: 'Solicitações', usuario: req.usuario });
});

// Holerites
router.get('/holerites', verificarToken, autorizarTipoUsuario(['colaborador']), (req, res) => {
  return res.render('colaborador/holerites', { title: 'Meus Holerites', usuario: req.usuario });
});

/* ==========================
   Multer (upload de foto)
   ========================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/* ==========================
   Rotas API públicas / autenticação
   ========================== */
router.post('/register', upload.single('foto'), colaboradorController.register);
router.post('/login', authController.login);

router.get('/nextRegistro', async (req, res) => {
  try {
    const { empresa_id } = req.query;
    if (!empresa_id) return res.status(400).json({ message: 'empresa_id é obrigatório' });
    const proximo = await Colaborador.proximoRegistro(empresa_id);
    const numeroFormatado = 'C' + String(proximo).padStart(3, '0');
    return res.json({ proximoRegistro: numeroFormatado });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Erro interno' }); }
});

/* ==========================
   Rotas API protegidas (token necessário)
   ========================== */
router.get('/perfil', verificarToken, colaboradorController.getProfile);
router.put('/atualizar', verificarToken, upload.single('foto'), (req,res,next) => { console.log('REQ.UPDATE', req.body); next(); }, colaboradorController.update);
router.put('/:id/salario', verificarToken, colaboradorController.updateSalario);
router.get('/:id/beneficios', verificarToken, colaboradorController.getBeneficios);
router.put('/:id/beneficios', verificarToken, colaboradorController.updateBeneficios);
router.delete('/:id/beneficios/:beneficioId', verificarToken, async (req,res) => {
  try {
    const { beneficioId } = req.params;
    const UsuarioBeneficios = require('../models/usuariosBeneficiosModel');
    await UsuarioBeneficios.removeBeneficio(beneficioId);
    return res.json({ success: true, message: 'Benefício removido' });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Erro' }); }
});

router.get('/listar', verificarToken, colaboradorController.listar);
router.get('/setores', verificarToken, colaboradorController.listarSetores);
router.post('/setores', verificarToken, colaboradorController.criarSetor);
router.get('/beneficios/cargo', verificarToken, colaboradorController.listarBeneficiosPorCargo);

module.exports = router;
