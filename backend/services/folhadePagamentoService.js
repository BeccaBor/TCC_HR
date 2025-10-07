// backend/services/folhadePagamentoService.js

/**
 * Calcula horas trabalhadas a partir dos registros de ponto do mês
 * @param {Array} registros - Array de registros do ponto no formato {data_hora_registro, tipo_registro}
 * @param {number} horasDiariasEsperadas - Horas esperadas por dia
 * @returns {Object} {totalHoras, faltas, detalhesPorDia, horasFaltadas}
 */
function calcularHorasTrabalhadas(registros, horasDiariasEsperadas = 8) {
  // Agrupar por dia
  const porDia = {};
  
  registros.forEach(reg => {
    const data = new Date(reg.data_hora_registro);
    const dia = data.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!porDia[dia]) {
      porDia[dia] = [];
    }
    porDia[dia].push({
      hora: data,
      tipo: reg.tipo_registro,
      horas: reg.horas || 0
    });
  });

  let totalMinutos = 0;
  const faltas = [];
  const detalhesPorDia = {};

  // Processar cada dia
  Object.keys(porDia).forEach(dia => {
    const registrosDia = porDia[dia].sort((a, b) => a.hora - b.hora);
    let minutosTrabalhadosDia = 0;
    
    // Parear entradas e saídas
    let entrada = null;
    let intervaloInicio = null;
    
    registrosDia.forEach(reg => {
      if (reg.tipo === 'entrada' && !entrada) {
        entrada = reg.hora;
      } else if (reg.tipo === 'inicio_intervalo' && entrada) {
        intervaloInicio = reg.hora;
      } else if (reg.tipo === 'fim_intervalo') {
        intervaloInicio = null; // Retorna do intervalo
      } else if (reg.tipo === 'saida' && entrada) {
        const diff = (reg.hora - entrada) / 1000 / 60; // minutos
        minutosTrabalhadosDia += diff;
        entrada = null;
      }
    });

    detalhesPorDia[dia] = {
      horasTrabalhadas: minutosTrabalhadosDia / 60,
      horasEsperadas: horasDiariasEsperadas,
      diferenca: (minutosTrabalhadosDia / 60) - horasDiariasEsperadas
    };

    if (minutosTrabalhadosDia === 0) {
      faltas.push(dia);
    }

    totalMinutos += minutosTrabalhadosDia;
  });

  const totalHoras = totalMinutos / 60;
  
  return {
    totalHoras: Number(totalHoras.toFixed(2)),
    faltas,
    detalhesPorDia,
    horasFaltadas: faltas.length * horasDiariasEsperadas
  };
}

/**
 * Calcula dias úteis no mês (segunda a sexta, exceto feriados)
 * @param {number} ano
 * @param {number} mes - 1-12
 * @param {Array} feriados - Array de datas de feriados ['YYYY-MM-DD']
 * @returns {number}
 */
function calcularDiasUteis(ano, mes, feriados = []) {
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  let diasUteis = 0;

  for (let dia = primeiroDia; dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
    const diaSemana = dia.getDay();
    const dataStr = dia.toISOString().split('T')[0];
    
    // Segunda (1) a Sexta (5), não é feriado
    if (diaSemana >= 1 && diaSemana <= 5 && !feriados.includes(dataStr)) {
      diasUteis++;
    }
  }

  return diasUteis;
}

/**
 * Calcula INSS baseado nas faixas progressivas
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
 * Calcula IRRF
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
 * Calcula FGTS (8% do salário bruto)
 */
function calcularFGTS(salarioBruto) {
  salarioBruto = Number(salarioBruto) || 0;
  return Number((salarioBruto * 0.08).toFixed(2));
}

/**
 * Calcula folha de um funcionário específico
 * @param {Object} params
 * @param {number} params.salarioBruto
 * @param {number} params.dependentes
 * @param {number} params.horasFaltadas
 * @param {number} params.horasEsperadas
 * @param {Array} params.beneficios
 * @returns {Object} Detalhes da folha
 */
function calcularFolhaFuncionario({
  salarioBruto,
  dependentes = 0,
  horasFaltadas = 0,
  horasEsperadas = 176, // ~22 dias * 8h
  beneficios = []
}) {
  salarioBruto = Number(salarioBruto) || 0;
  
  // Calcular valor da hora
  const valorHora = horasEsperadas > 0 ? salarioBruto / horasEsperadas : 0;
  
  // Desconto por faltas
  const descontoPorFaltas = horasFaltadas * valorHora;
  
  // Salário após descontos de falta
  const salarioAposDescontoFaltas = salarioBruto - descontoPorFaltas;
  
  // Calcular impostos
  const inss = calcularINSS(salarioAposDescontoFaltas);
  const baseIR = salarioAposDescontoFaltas - inss;
  const irrf = calcularIRRF(baseIR, dependentes);
  const fgts = calcularFGTS(salarioAposDescontoFaltas);
  
  // Somar benefícios
  let totalBeneficios = 0;
  beneficios.forEach(b => {
    const valor = Number(b.valor_personalizado || b.valor_aplicado || 0);
    totalBeneficios += valor;
  });
  
  // Total de descontos
  const totalDescontos = inss + irrf + descontoPorFaltas;
  
  // Salário líquido
  const salarioLiquido = salarioBruto - totalDescontos + totalBeneficios;
  
  return {
    salarioBruto: Number(salarioBruto.toFixed(2)),
    valorHora: Number(valorHora.toFixed(2)),
    horasFaltadas: Number(horasFaltadas.toFixed(2)),
    descontoPorFaltas: Number(descontoPorFaltas.toFixed(2)),
    totalINSS: inss,
    totalIRRF: irrf,
    totalFGTS: fgts,
    totalBeneficios: Number(totalBeneficios.toFixed(2)),
    totalDescontos: Number(totalDescontos.toFixed(2)),
    salarioLiquido: Number(salarioLiquido.toFixed(2)),
    beneficios
  };
}

/**
 * Calcula folha completa de todos os funcionários
 */
function calcularFolhaCompleta(funcionarios) {
  let totalBruto = 0;
  let totalINSS = 0;
  let totalIRRF = 0;
  let totalFGTS = 0;
  let totalLiquido = 0;
  let totalDescontos = 0;
  
  const detalhesFuncionarios = funcionarios.map(f => {
    const resultado = calcularFolhaFuncionario({
      salarioBruto: f.salario || f.salarioBruto || 0,
      dependentes: f.dependentes || 0,
      horasFaltadas: f.horasFaltadas || 0,
      horasEsperadas: f.horasEsperadas || 176,
      beneficios: f.beneficios || []
    });
    
    totalBruto += resultado.salarioBruto;
    totalINSS += resultado.totalINSS;
    totalIRRF += resultado.totalIRRF;
    totalFGTS += resultado.totalFGTS;
    totalLiquido += resultado.salarioLiquido;
    totalDescontos += resultado.totalDescontos;
    
    return {
      ...f,
      ...resultado
    };
  });

  return {
    detalhesFuncionarios,
    resumo: {
      totalBruto: Number(totalBruto.toFixed(2)),
      totalINSS: Number(totalINSS.toFixed(2)),
      totalIRRF: Number(totalIRRF.toFixed(2)),
      totalFGTS: Number(totalFGTS.toFixed(2)),
      totalDescontos: Number(totalDescontos.toFixed(2)),
      totalLiquido: Number(totalLiquido.toFixed(2))
    }
  };
}

module.exports = {
  calcularHorasTrabalhadas,
  calcularDiasUteis,
  calcularINSS,
  calcularIRRF,
  calcularFGTS,
  calcularFolhaFuncionario,
  calcularFolhaCompleta
};