const pontoModel = require('../models/pontoModel');
const usuarioModel = require('../models/usuarioModel');

/**
 * Endpoint para retornar dados do usuário logado
 */
exports.getMe = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const usuario = await usuarioModel.findById(usuarioId);
    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    // Se for gestor e não tiver setor definido
    if (usuario.tipo_usuario === 'gestor' && !usuario.setor) {
      usuario.setor = 'Departamento Pessoal';
    }

    res.status(200).json({ usuario });
  } catch (err) {
    console.error('Erro em getMe:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

/**
 * Registrar ponto
 */
exports.registrar = async (req, res) => {
  try {
    const { tipo_registro, horas } = req.body;
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const usuario = await usuarioModel.findById(usuarioId);
    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    // Se for gestor sem setor definido
    if (usuario.tipo_usuario === 'gestor' && !usuario.setor) {
      usuario.setor = 'Departamento Pessoal';
    }

    if (!tipo_registro || !horas) {
      return res.status(400).json({ message: 'Tipo de registro e horas são obrigatórios.' });
    }

    const registro = await pontoModel.registrar({
      usuarioId,
      nome: usuario.nome,
      setor: usuario.setor,
      tipo_usuario: usuario.tipo_usuario,
      tipo_registro,
      horas,
      cnpj: usuario.cnpj
    });

    return res.status(201).json({ message: 'Ponto registrado com sucesso.', registro });
  } catch (err) {
    console.error('Erro ao registrar ponto:', err);
    return res.status(500).json({ message: err.message || 'Erro interno no servidor.' });
  }
};

/**
 * Listar registros do usuário logado
 */
exports.getMeusRegistros = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const registros = await pontoModel.getByUsuarioId(usuarioId);
    res.status(200).json({ registros });
  } catch (err) {
    console.error('Erro em getMeusRegistros:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

/**
 * Listar registros da empresa (apenas gestores)
 */
exports.getRegistrosEmpresa = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ message: 'Usuário não autenticado.' });

    const usuario = await usuarioModel.findById(usuarioId);
    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (usuario.tipo_usuario !== 'gestor') {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const registros = await pontoModel.getByEmpresaId(usuario.empresa_id);
    res.status(200).json({ registros });
  } catch (err) {
    console.error('Erro em getRegistrosEmpresa:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};
