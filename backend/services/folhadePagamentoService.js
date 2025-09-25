// backend/services/folhadePagamentoService.js

/**
 * Calcula o desconto de INSS baseado nas faixas de salário
 * @param {number} salarioBruto
 * @returns {number} desconto INSS
 */
function calcularINSS(salarioBruto) {
  salarioBruto = Number(salarioBruto) || 0;

  const faixas = [
    { limite: 1320.00, aliquota: 0.075 },
    { limite: 2571.29, aliquota: 0.09 },
    { limite: 3856.94, aliquota: 0.12 },
    { limite: 7507.49, aliquota: 0.14 }
  ];

  let desconto = 0;
  let faixaAnterior = 0;

  for (let i = 0; i < faixas.length; i++) {
    const faixa = faixas[i];
    const base = Math.min(salarioBruto, faixa.limite) - faixaAnterior;
    if (base > 0) {
      desconto += base * faixa.aliquota;
      faixaAnterior = faixa.limite;
    }
    if (salarioBruto <= faixa.limite) break;
  }

  return Number(desconto.toFixed(2));
}

/**
 * Calcula o IRRF (Imposto de Renda Retido na Fonte)
 * @param {number} salarioBase
 * @param {number} dependentes
 * @returns {number} valor do IRRF
 */
function calcularIRRF(salarioBase, dependentes = 0) {
  salarioBase = Number(salarioBase) || 0;
  dependentes = Number(dependentes) || 0;

  const deducaoPorDependente = 189.59;
  const base = Math.max(0, salarioBase - dependentes * deducaoPorDependente);

  const faixas = [
    { limite: 1903.98, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 142.80 },
    { limite: 3751.05, aliquota: 0.15, deducao: 354.80 },
    { limite: 4664.68, aliquota: 0.225, deducao: 636.13 },
    { limite: Infinity, aliquota: 0.275, deducao: 869.36 }
  ];

  let aliquota = 0;
  let deducao = 0;

  for (let i = 0; i < faixas.length; i++) {
    if (base <= faixas[i].limite) {
      aliquota = faixas[i].aliquota;
      deducao = faixas[i].deducao;
      break;
    }
  }

  const imposto = Math.max(0, base * aliquota - deducao);
  return Number(imposto.toFixed(2));
}

/**
 * Calcula o FGTS (8% do salário bruto)
 * @param {number} salarioBruto
 * @returns {number} valor do FGTS
 */
function calcularFGTS(salarioBruto) {
  salarioBruto = Number(salarioBruto) || 0;
  return Number((salarioBruto * 0.08).toFixed(2));
}

/**
 * Calcula a folha de pagamento de um funcionário
 * @param {object} param0 
 * @param {number} param0.salarioBruto
 * @param {number} param0.dependentes
 * @param {number} param0.descontosFixos
 * @param {number} param0.outrasRetencoes
 * @returns {object} detalhes da folha
 */
function calcularFolhaFuncionario({ salarioBruto, dependentes = 0, descontosFixos = 0, outrasRetencoes = 0 }) {
  salarioBruto = Number(salarioBruto) || 0;
  descontosFixos = Number(descontosFixos) || 0;
  outrasRetencoes = Number(outrasRetencoes) || 0;

  const inss = calcularINSS(salarioBruto);
  const baseIR = salarioBruto - inss - descontosFixos;
  const irrf = calcularIRRF(baseIR, dependentes);
  const fgts = calcularFGTS(salarioBruto);

  const totalDescontos = Number((inss + irrf + descontosFixos + outrasRetencoes).toFixed(2));
  const salarioLiquido = Number((salarioBruto - totalDescontos).toFixed(2));

  return {
    salarioBruto: Number(salarioBruto.toFixed(2)),
    totalINSS: inss,
    totalIRRF: irrf,
    totalFGTS: fgts,
    totalDescontos,
    salarioLiquido
  };
}

/**
 * Calcula a folha completa de todos os funcionários
 * @param {Array} funcionarios
 * @returns {object} resumo da folha
 */
function calcularFolhaCompleta(funcionarios) {
  let totalBruto = 0, totalINSS = 0, totalIRRF = 0, totalFGTS = 0, totalLiquido = 0;

  funcionarios.forEach(f => {
    const res = calcularFolhaFuncionario(f);
    totalBruto += res.salarioBruto;
    totalINSS += res.totalINSS;
    totalIRRF += res.totalIRRF;
    totalFGTS += res.totalFGTS;
    totalLiquido += res.salarioLiquido;
  });

  return {
    totalBruto: Number(totalBruto.toFixed(2)),
    totalINSS: Number(totalINSS.toFixed(2)),
    totalIRRF: Number(totalIRRF.toFixed(2)),
    totalFGTS: Number(totalFGTS.toFixed(2)),
    totalLiquido: Number(totalLiquido.toFixed(2))
  };
}

module.exports = {
  calcularINSS,
  calcularIRRF,
  calcularFGTS,
  calcularFolhaFuncionario,
  calcularFolhaCompleta
};
