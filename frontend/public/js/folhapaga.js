// folhaPagamento_sistema/frontend/public/js/folhapaga.js
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const parts = path.split('/');
  const colaboradorId = parts[parts.length - 1];

  const nomeEl = document.getElementById('nome-colaborador');
  const form = document.getElementById('form-folha');
  const btnCalcular = document.getElementById('btn-calcular');
  const btnSalvar = document.getElementById('btn-salvar');

  async function load() {
    try {
      const res = await fetch(`/api/gestor/colaborador/${colaboradorId}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('erro');
      const c = await res.json();
      nomeEl.textContent = c.nome || '—';
      form.colaboradorId.value = c.id;
      form.salario.value = c.salario || 0;
      form.horas_diarias.value = c.horas_diarias || 8;
      form.dependentes.value = c.dependentes || 0;
      form.horas_extras.value = c.horas_extras || 0;
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar colaborador');
    }
  }

  async function calcular() {
    const body = {
      salario: Number(form.salario.value || 0),
      horas_diarias: Number(form.horas_diarias.value || 8),
      dependentes: Number(form.dependentes.value || 0),
      horas_extras: Number(form.horas_extras.value || 0)
    };
    try {
      const res = await fetch(`/api/gestor/colaborador/${colaboradorId}/calcular`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('erro no cálculo');
      const ret = await res.json();
      document.getElementById('r-salario').textContent = ret.salarioBase ? `R$ ${Number(ret.salarioBase).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : `R$ ${Number(body.salario).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
      document.getElementById('r-inss').textContent = `R$ ${Number(ret.totalINSS||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
      document.getElementById('r-irrf').textContent = `R$ ${Number(ret.totalIRRF||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
      document.getElementById('r-fgts').textContent = `R$ ${Number(ret.totalFGTS||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
      document.getElementById('r-liquido').textContent = `R$ ${Number(ret.totalLiquido||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
    } catch (err) {
      console.error(err);
      alert('Erro ao calcular');
    }
  }

  async function salvar() {
    const body = {
      salario: Number(form.salario.value || 0),
      horas_diarias: Number(form.horas_diarias.value || 8),
      dependentes: Number(form.dependentes.value || 0)
    };
    try {
      const res = await fetch(`/api/gestor/colaborador/${colaboradorId}/update`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify(body)
      });
      const ret = await res.json();
      if (ret.success) {
        alert('Salvo com sucesso');
        window.location.href = '/gestor/folhadepagamento';
      } else {
        alert('Falha ao salvar');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    }
  }

  btnCalcular.addEventListener('click', calcular);
  btnSalvar.addEventListener('click', salvar);

  load();
});
