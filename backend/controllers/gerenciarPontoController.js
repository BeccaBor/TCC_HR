// // backend/controllers/gerenciarPontoController.js
// const gerenciarPontoModel = require('../models/gerenciarPontoModel');

// /**
//  * Registra um ponto
//  */
// exports.registrarPonto = async (req, res) => {
//   try {
//     const { nome, setor, tipo_usuario, tipo_registro, horas } = req.body;
//     const cnpj = req.usuario?.cnpj;

//     if (!cnpj) return res.status(400).json({ message: 'CNPJ do usuário não encontrado no token.' });
//     if (!nome || !tipo_registro) {
//       return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
//     }

//     const resultado = await gerenciarPontoModel.registrar({
//       nome,
//       setor,
//       tipo_usuario,
//       tipo_registro,
//       horas,
//       cnpj
//     });

//     return res.status(201).json({ message: 'Ponto registrado com sucesso!', registro: resultado });
//   } catch (err) {
//     console.error('Erro ao registrar ponto:', err);
//     return res.status(500).json({ message: 'Erro interno no servidor.' });
//   }
// };

// /**
//  * Busca registros recentes do usuário logado
//  */
// exports.getRecent = async (req, res) => {
//   try {
//     const cnpj = req.usuario?.cnpj;
//     if (!cnpj) return res.status(400).json({ message: 'CNPJ não encontrado.' });

//     const limit = parseInt(req.query.limit, 10) || 20;
//     const registros = await gerenciarPontoModel.getRecent(cnpj, limit);

//     return res.status(200).json({ registros });
//   } catch (err) {
//     console.error('Erro ao buscar registros recentes:', err);
//     return res.status(500).json({ message: 'Erro interno no servidor.' });
//   }
// };

// /**
//  * Busca todos os registros de ponto da empresa (gestor)
//  */
// exports.getRecentEmpresa = async (req, res) => {
//   try {
//     const cnpj = req.usuario?.cnpj;
//     if (!cnpj) return res.status(400).json({ message: 'CNPJ não encontrado.' });

//     const registros = await gerenciarPontoModel.getRecent(cnpj, 1000);

//     return res.status(200).json({ registros });
//   } catch (err) {
//     console.error('Erro ao buscar registros da empresa:', err);
//     return res.status(500).json({ message: 'Erro interno no servidor.' });
//   }
// };
