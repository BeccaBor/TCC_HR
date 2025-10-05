// controllers/colaboradorController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Colaborador = require("../models/colaboradorModel");
const UsuarioBeneficios = require("../models/usuariosBeneficiosModel");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// tentativa de require do model de gerenciarbeneficios (opcional)
let GerenciarBeneficios = null;
try {
  GerenciarBeneficios = require("../models/usuariosBeneficiosModel");
} catch (err) {
  console.warn("Model gerenciarBeneficiosModel não encontrado — requisições com array de IDs de benefícios irão pular resolução por ID.");
}

// Função utilitária para normalizar/parsing de benefícios
function parseBeneficios(beneficios) {
  if (!beneficios) return [];
  let arr = [];

  try {
    arr = typeof beneficios === "string" ? JSON.parse(beneficios) : beneficios;
  } catch (err) {
    console.error("Erro ao parsear benefícios:", err);
    return [];
  }

  return arr.map(item => ({
    nome_do_beneficio: item.nome_do_beneficio || item.nome || null,
    descricao_beneficio: item.descricao_beneficio || item.descricao || null,
    valor_aplicado: Number(item.valor_aplicado ?? item.valor ?? item.valor_personalizado ?? 0)
  })).filter(b => b.nome_do_beneficio);
}


const colaboradorController = {
  // ==============================
  // REGISTRO E LOGIN
  // ==============================
  async register(req, res) {
    try {
      const { nome, cpf, cargo, setor, tipo_jornada, horas_diarias, senha, empresa_id, numero_registro, cnpj } = req.body;

      if (!nome || !senha || !empresa_id) {
        return res.status(400).json({ success: false, message: "Campos obrigatórios não preenchidos" });
      }

      const salario = req.body.salario ? parseFloat(req.body.salario) : 0;
      const beneficiosArray = await parseBeneficios(req.body.beneficios);
      const foto = req.file ? req.file.filename : null;
      const registro = numero_registro || await Colaborador.proximoRegistro(empresa_id);
// CORRIGIDO
const senha_hash = senha ? await bcrypt.hash(senha, 10) : null;

const novoColab = await Colaborador.create({
  empresa_id,
  numero_registro: registro,
  nome,
  cpf: cpf || null,
  cnpj: cnpj || req.user?.cnpj || null,
  senha_hash,   // <- agora certo
  cargo: cargo || null,
  setor: setor || null,
  tipo_jornada,
  horas_diarias,
  foto: foto || null,
  salario
});

      // Inserir benefícios
      for (const b of beneficiosArray) {
        try {
          await UsuarioBeneficios.addBeneficio({
            gestor_id: req.user?.id || 1,
            usuario_id: novoColab.id,
            cargo: cargo || null,
            nome_do_beneficio: b.nome_do_beneficio,
            descricao_beneficio: b.descricao_beneficio,
            valor_aplicado: b.valor_aplicado,
            data_inicio: new Date(),
            ativo: 1
          });
        } catch (err) {
          console.error("Falha ao inserir usuario_beneficios:", err.message);
        }
      }

      const criado = await Colaborador.findById(novoColab.id);
      criado.beneficios = await UsuarioBeneficios.findByUsuario(novoColab.id);

      return res.status(201).json({
        success: true,
        message: "Colaborador registrado com sucesso",
        data: criado
      });
    } catch (error) {
      console.error("Erro no registro de colaborador:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor", error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { empresa_id, numero_registro, senha } = req.body;
      const colaborador = await Colaborador.findByRegistro(empresa_id, numero_registro);
      if (!colaborador) return res.status(404).json({ success: false, message: "Colaborador não encontrado" });

      const senhaValida = await bcrypt.compare(senha, colaborador.senha_hash);
      if (!senhaValida) return res.status(401).json({ success: false, message: "Senha incorreta" });

      const token = jwt.sign(
        { id: colaborador.id, empresa_id: colaborador.empresa_id, numero_registro: colaborador.numero_registro, tipo_usuario: "colaborador" },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({ success: true, message: "Login realizado com sucesso", token });
    } catch (error) {
      console.error("Erro no login do colaborador:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  // ==============================
  // PERFIL E LISTAGEM
  // ==============================
  async getProfile(req, res) {
    try {
      const { id } = req.user;
      const colaborador = await Colaborador.findById(id);
      if (!colaborador) return res.status(404).json({ success: false, message: "Colaborador não encontrado" });

      colaborador.beneficios = await UsuarioBeneficios.findByUsuario(id);

      return res.json({ success: true, data: colaborador });
    } catch (error) {
      console.error("Erro ao buscar perfil do colaborador:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  async listar(req, res) {
    try {
      const empresa_id = req.query.empresa_id || req.user?.empresa_id;
      const { setor } = req.query;
      if (!empresa_id) return res.status(400).json({ success: false, message: "empresa_id é obrigatório" });

      let colaboradores = await Colaborador.findByEmpresa(empresa_id);
      for (let c of colaboradores) c.beneficios = await UsuarioBeneficios.findByUsuario(c.id);
      if (setor) colaboradores = colaboradores.filter(c => c.setor === setor);

      return res.json({ success: true, data: colaboradores });
    } catch (error) {
      console.error("Erro ao listar colaboradores:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "ID do colaborador é obrigatório" });

      const colaborador = await Colaborador.findById(id);
      if (!colaborador) return res.status(404).json({ success: false, message: "Colaborador não encontrado" });

      colaborador.beneficios = await UsuarioBeneficios.findByUsuario(id);

      return res.json({ success: true, data: colaborador });
    } catch (error) {
      console.error("Erro ao buscar colaborador por ID:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  // ==============================
  // ATUALIZAÇÕES
  // ==============================
 async update(req, res) {
  try {
    const { id, nome, cpf, cargo, setor, tipo_jornada, horas_diarias, senha } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "ID do colaborador é obrigatório" });

    const salario = req.body.salario ? parseFloat(req.body.salario) : undefined;
    const beneficiosArray = await parseBeneficios(req.body.beneficios) || [];

    const updateData = { nome, cpf, cargo, setor, tipo_jornada, horas_diarias };
    if (typeof salario !== "undefined") updateData.salario = salario;
    if (req.file) updateData.foto = req.file.filename;
    if (senha) updateData.senha_hash = await bcrypt.hash(senha, 10);

    // Atualiza os dados do colaborador
    await Colaborador.update(id, updateData);

    // Atualiza os benefícios apenas se vierem no corpo da requisição
    if (beneficiosArray.length > 0) {
      const atuais = await UsuarioBeneficios.findByUsuario(id);

     // CORRIGIDO
for (const b of atuais) {
  const bid = b.id || b.beneficio_id;
  if (bid) {
    await UsuarioBeneficios.removeBeneficio(bid);
  }
}


      for (const b of beneficiosArray) {
        await UsuarioBeneficios.addBeneficio({
          gestor_id: req.user?.id || 1,
          usuario_id: id,
          cargo: cargo || updateData.cargo || null,
          nome_do_beneficio: b.nome_do_beneficio,
          descricao_beneficio: b.descricao_beneficio,
          valor_aplicado: b.valor_aplicado,
          data_inicio: new Date(),
          ativo: 1
        });
      }
    }

    const col = await Colaborador.findById(id);
    col.beneficios = await UsuarioBeneficios.findByUsuario(id);

    return res.json({ success: true, message: "Colaborador atualizado com sucesso", data: col });

  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error);
    return res.status(500).json({ success: false, message: "Erro interno no servidor", error: error.message });
  }
}
,

  async updateSalario(req, res) {
    try {
      const { id } = req.params;
      const { salario } = req.body;
      if (!id || typeof salario === "undefined") return res.status(400).json({ success: false, message: "ID e salário são obrigatórios" });

      const s = parseFloat(salario);
      if (isNaN(s)) return res.status(400).json({ success: false, message: "Salário inválido" });

      await Colaborador.update(id, { salario: s });

      return res.json({ success: true, message: "Salário atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar salário:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  async updateBeneficios(req, res) {
    try {
      const { id } = req.params;
      const beneficiosArray = await parseBeneficios(req.body.beneficios);
      if (!id || !beneficiosArray) return res.status(400).json({ success: false, message: "ID e benefícios são obrigatórios" });

      const atuais = await UsuarioBeneficios.findByUsuario(id);
      for (const b of atuais) await UsuarioBeneficios.removeBeneficio(b.id);

  for (const b of beneficiosArray) {
  await UsuarioBeneficios.addBeneficio({
    gestor_id: req.user?.id || 1,
    usuario_id: id,
    cargo: null,
    nome_do_beneficio: b.nome_do_beneficio,
    descricao_beneficio: b.descricao_beneficio,
    valor_aplicado: Number(
      b.valor_aplicado ??
      b.valor_personalizado ??
      b.valor ??
      0
    ),
    data_inicio: new Date(),
    ativo: 1
  });
}


      const col = await Colaborador.findById(id);
      col.beneficios = await UsuarioBeneficios.findByUsuario(id);

      return res.json({ success: true, message: "Benefícios atualizados com sucesso", data: col });
    } catch (error) {
      console.error("Erro ao atualizar benefícios:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  async getBeneficios(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "ID do colaborador é obrigatório" });

      const beneficios = await UsuarioBeneficios.findByUsuario(id);
      return res.json({ success: true, data: beneficios });
    } catch (error) {
      console.error("Erro ao listar benefícios do colaborador:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  // ==============================
  // SETORES
  // ==============================
  async criarSetor(req, res) {
    try {
      const { nome_setor } = req.body;
      const empresa_id = req.user?.empresa_id || req.body.empresa_id;
      if (!empresa_id || !nome_setor) return res.status(400).json({ success: false, message: "empresa_id e nome_setor são obrigatórios" });

      const setor = await Colaborador.criarSetor(empresa_id, nome_setor);
      return res.status(201).json({ success: true, message: "Setor criado com sucesso", data: setor });
    } catch (error) {
      console.error("Erro ao criar setor:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  async listarSetores(req, res) {
    try {
      const empresa_id = req.query.empresa_id || req.user?.empresa_id;
      if (!empresa_id) return res.status(400).json({ success: false, message: "empresa_id é obrigatório" });

      const setores = await Colaborador.listarSetores(empresa_id);
      return res.json({ success: true, data: setores });
    } catch (error) {
      console.error("Erro ao listar setores:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  // ==============================
  // EXCLUSÃO
  // ==============================
  async excluir(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: "ID do colaborador é obrigatório" });

      await Colaborador.delete(id);
      return res.json({ success: true, message: "Colaborador deletado com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar colaborador:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  // ==============================
  // REGISTRO AUTOMÁTICO
  // ==============================
  async proximoRegistro(req, res) {
    try {
      const empresa_id = req.query.empresa_id || req.user?.empresa_id;
      if (!empresa_id) return res.status(400).json({ success: false, message: "empresa_id é obrigatório" });

      const proximo = await Colaborador.proximoRegistro(empresa_id);
      return res.json({ success: true, proximoRegistro: proximo || "C001" });
    } catch (error) {
      console.error("Erro ao obter próximo registro:", error);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  },

  // ==============================
  // BENEFÍCIOS POR CARGO
  // ==============================
  async listarBeneficiosPorCargo(req, res) {
    try {
      const { cargo, usuario_id } = req.query;
      if (!cargo) return res.status(400).json({ success: false, message: "Cargo é obrigatório" });

      const beneficiosCargo = await UsuarioBeneficios.findTemplatesByCargo(cargo, { apenasAtivos: true });
      let beneficiosUsuario = [];
      if (usuario_id) beneficiosUsuario = await UsuarioBeneficios.findByUsuario(usuario_id);

      const beneficios = beneficiosCargo.map(b => ({
        id: b.id,
        nome_do_beneficio: b.nome_do_beneficio,
        descricao_beneficio: b.descricao_beneficio,
        valor_aplicado: b.valor_aplicado,
        selecionado: beneficiosUsuario.some(ub => ub.beneficio_id === b.id)
      }));

      return res.json({ success: true, data: beneficios });
    } catch (err) {
      console.error("Erro ao listar benefícios por cargo:", err.message);
      return res.status(500).json({ success: false, message: "Erro interno no servidor" });
    }
  }
};

module.exports = colaboradorController;
