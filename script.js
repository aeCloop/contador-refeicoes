const printMesEl = document.querySelector("#printMes");
const printDataEmissaoEl = document.querySelector("#printDataEmissao");
const printUnidadeEl = document.querySelector("#printUnidade");

const unidadeEl = document.querySelector("#unidade");

const dataEl = document.querySelector("#data");
const almocoEl = document.querySelector("#almoco");
const jantarEl = document.querySelector("#jantar");

const btnSalvar = document.querySelector("#btnSalvar");
const btnHoje = document.querySelector("#btnHoje");
const btnLimparMes = document.querySelector("#btnLimparMes");

const mesEl = document.querySelector("#mes");
const btnExportar = document.querySelector("#btnExportar");
const btnImprimir = document.querySelector("#btnImprimir");

const tbody = document.querySelector("#tbody");
const totalAlmocoEl = document.querySelector("#totalAlmoco");
const totalJantarEl = document.querySelector("#totalJantar");
const totalGeralEl = document.querySelector("#totalGeral");
const msgEl = document.querySelector("#msg");

const STORAGE_KEY = "refeicoes_v1";
const STORAGE_KEY_UNIDADE = "refeicoes_unidade_v1";

function hojeISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mesAtualISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadUnidade() {
  try {
    return localStorage.getItem(STORAGE_KEY_UNIDADE) ?? "";
  } catch {
    return "";
  }
}

function saveUnidade(value) {
  localStorage.setItem(STORAGE_KEY_UNIDADE, value ?? "");
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function setMsg(text) {
  msgEl.textContent = text;
  if (text) setTimeout(() => (msgEl.textContent = ""), 2500);
}

function getMonthEntries(all, ym) {
  const entries = Object.entries(all)
    .filter(([date]) => date.startsWith(ym + "-"))
    .map(([date, val]) => ({ date, almoco: val.almoco ?? 0, jantar: val.jantar ?? 0 }));

  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

function render() {
  const all = loadData();
  const ym = mesEl.value || mesAtualISO();
  const entries = getMonthEntries(all, ym);

  tbody.innerHTML = "";

  let totalAlmoco = 0;
  let totalJantar = 0;

  for (const e of entries) {
    const totalDia = e.almoco + e.jantar;
    totalAlmoco += e.almoco;
    totalJantar += e.jantar;

    const tr = document.createElement("tr");
    const dia = e.date.slice(8, 10);

    tr.innerHTML = `
      <td data-label="Dia">${dia}</td>
      <td data-label="Almoço">${e.almoco}</td>
      <td data-label="Jantar">${e.jantar}</td>
      <td data-label="Total do dia"><strong>${totalDia}</strong></td>
      <td class="actions" data-label="Ações">
        <button class="small secundario" data-edit="${e.date}">Editar</button>
        <button class="small perigo" data-del="${e.date}">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  }

  totalAlmocoEl.textContent = String(totalAlmoco);
  totalJantarEl.textContent = String(totalJantar);
  totalGeralEl.textContent = String(totalAlmoco + totalJantar);

  if (entries.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="color:#cbd5e1;">Sem dados neste mês.</td>`;
    tbody.appendChild(tr);
  }
}

function scrollToRelatorio() {
  const el = document.querySelector("h2");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function salvarDia() {
  const date = dataEl.value;
  if (!date) {
    setMsg("Escolha uma data.");
    return;
  }

  const almoco = toInt(almocoEl.value);
  const jantar = toInt(jantarEl.value);

  const all = loadData();
  all[date] = { almoco, jantar };
  saveData(all);

  // ✅ ZERA OS CAMPOS
  almocoEl.value = 0;
  jantarEl.value = 0;

  setMsg("Salvo ✅");
  render();
  scrollToRelatorio();
}

function editarDia(date) {
  const all = loadData();
  const val = all[date];
  if (!val) return;

  dataEl.value = date;
  almocoEl.value = val.almoco ?? 0;
  jantarEl.value = val.jantar ?? 0;
  setMsg("Editando... altere e clique em Salvar.");
}

function excluirDia(date) {
  const all = loadData();
  if (!all[date]) return;

  const dia = date.slice(8, 10);
  const ym = date.slice(0, 7);

  const ok = confirm(`Tem certeza que deseja excluir o registro do dia ${dia}/${ym.replace("-", "/")}?`);
  if (!ok) {
    setMsg("Exclusão cancelada.");
    return;
  }

  delete all[date];
  saveData(all);

  setMsg("Excluído 🗑️");
  render();
}

function limparMesAtual() {
  const ym = mesEl.value || mesAtualISO();
  const all = loadData();

  const ok = confirm("Tem certeza que deseja limpar TODOS os registros deste mês?");
  if (!ok) {
    setMsg("Limpeza cancelada.");
    return;
  }

  for (const date of Object.keys(all)) {
    if (date.startsWith(ym + "-")) delete all[date];
  }
  saveData(all);

  setMsg("Mês limpo ✅");
  render();
}

function exportarCSV() {
  const all = loadData();
  const ym = mesEl.value || mesAtualISO();
  const entries = getMonthEntries(all, ym);

  const header = ["Data", "Almoco", "Jantar", "TotalDia"];
  const lines = [header.join(",")];

  let totalA = 0, totalJ = 0;

  for (const e of entries) {
    const totalDia = e.almoco + e.jantar;
    totalA += e.almoco;
    totalJ += e.jantar;
    lines.push([e.date, e.almoco, e.jantar, totalDia].join(","));
  }

  lines.push(["TOTAL_MES", totalA, totalJ, totalA + totalJ].join(","));

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `refeicoes_${ym}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

function imprimirRelatorio() {
  // garante que o PDF sempre reflita o estado atual
  render();

  const ym = mesEl.value || mesAtualISO();
  const [ano, mes] = ym.split("-");

  const nomeMes = new Date(Number(ano), Number(mes) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const unidade = (unidadeEl?.value ?? loadUnidade()).trim();

  if (printUnidadeEl) {
    printUnidadeEl.textContent = unidade ? `Unidade: ${unidade}` : "Unidade: (não informada)";
  }

  if (printMesEl) printMesEl.textContent = `Mês: ${nomeMes}`;
  if (printDataEmissaoEl) {
    printDataEmissaoEl.textContent = `Emitido em: ${new Date().toLocaleDateString("pt-BR")}`;
  }

  window.print();
}

tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const dateEdit = btn.getAttribute("data-edit");
  const dateDel = btn.getAttribute("data-del");

  if (dateEdit) editarDia(dateEdit);
  if (dateDel) excluirDia(dateDel);
});

btnSalvar.addEventListener("click", salvarDia);

btnHoje.addEventListener("click", () => {
  dataEl.value = hojeISO();
  setMsg("Data definida para hoje.");
});

btnLimparMes.addEventListener("click", limparMesAtual);
btnExportar.addEventListener("click", exportarCSV);
btnImprimir.addEventListener("click", imprimirRelatorio);

mesEl.addEventListener("change", render);

// Defaults
dataEl.value = hojeISO();
mesEl.value = mesAtualISO();

// Unidade (salva automaticamente)
if (unidadeEl) {
  unidadeEl.value = loadUnidade();
  unidadeEl.addEventListener("input", () => {
    saveUnidade(unidadeEl.value.trim());
  });
}

// ✅ Remove o zero ao focar e volta zero se sair vazio
function setupZeroBehavior(inputEl) {
  inputEl.addEventListener("focus", () => {
    if (inputEl.value === "0") {
      inputEl.value = "";
    }
  });

  inputEl.addEventListener("blur", () => {
    if (inputEl.value.trim() === "") {
      inputEl.value = "0";
    }
  });
}

setupZeroBehavior(almocoEl);
setupZeroBehavior(jantarEl);

render();