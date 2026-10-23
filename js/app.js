/**
 * HAVOC BASE - SISTEMA OPERACIONAL UNIFICADO
 * Fase 2: Tela 1 (Boas-vindas com Versículo do Dia & Emblema Oficial)
 * Fase 3: Tela 2 (Central de Aplicativos 100% Unificada em 1 só App)
 * 
 * Módulos Integrados:
 * 1. Treino Operacional (TFM, Força, Circuito & Cronômetro)
 * 2. Orthodoxus DO (Musculação, Fichas, Filtro por Músculo & GIFs Animados)
 * 3. Financeiro (+Entrada, -Saída, Parcelas Inteligentes, Contas Pagas Riscadas)
 * 4. Tarefas & Lembretes (Checklist Diário)
 * 5. Recados & Mural de Anotações
 * 6. Backup Permanente (Exportar / Importar JSON)
 */

// ==========================================
// RELÓGIO & DATA HUD INSTANTÂNEOS
// ==========================================
(function() {
  function tickInstantHUD() {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour12: false });
      const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const welcomeClock = document.getElementById('welcome-live-clock');
      const welcomeDate = document.getElementById('welcome-live-date');
      const liveClock = document.getElementById('live-clock');
      if (welcomeClock) welcomeClock.textContent = timeStr;
      if (welcomeDate) welcomeDate.textContent = dateStr;
      if (liveClock) liveClock.textContent = timeStr;
    } catch (e) {}
  }
  tickInstantHUD();
  setInterval(tickInstantHUD, 1000);
})();

const DEFAULT_WALLPAPER = 'https://i.pinimg.com/736x/12/f1/b0/12f1b04afce3d33e17e920d2bd195d13.jpg';

const BACKUP_QUOTES = [
  { text: "Bendito seja o Senhor, minha rocha, que adestra as minhas mãos para a peleja e os meus dedos para a guerra.", author: "Salmos 144:1", category: "biblico" },
  { text: "Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares.", author: "Josué 1:9", category: "biblico" },
  { text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.", author: "2 Timóteo 1:7", category: "biblico" },
  { text: "Como o ferro com o ferro se afia, assim o homem afia o rosto do seu amigo.", author: "Provérbios 27:17", category: "biblico" },
  { text: "Revesti-vos de toda a armadura de Deus, para que possais estar firmes contra as astutas ciladas do inimigo.", author: "Efésios 6:11", category: "biblico" },
  { text: "Você não para quando está cansado. Você para quando termina.", author: "David Goggins", category: "goggins" },
  { text: "Quando sua mente diz que você chegou ao limite, você está na verdade apenas a 40% do que o seu corpo realmente aguenta.", author: "David Goggins (A Regra dos 40%)", category: "goggins" },
  { text: "O sofrimento é o verdadeiro teste da vida. É nele que você descobre quem você é quando ninguém está olhando.", author: "David Goggins", category: "goggins" },
  { text: "Seja incomum entre os incomuns. Não busque atalhos onde a disciplina é a única moeda aceita.", author: "David Goggins", category: "goggins" },
  { text: "Disciplina não é sobre motivação de momento; é sobre cumprir a missão mesmo quando você menos quer.", author: "Mentalidade Operacional", category: "disciplina" }
];

const INITIAL_DATA = {
  financeiro: [],
  tarefas: [
    { id: 1, title: "Inspecionar colete balístico e cautela", done: 1 },
    { id: 2, title: "Treino de saque rápido 15 min", done: 0 },
    { id: 3, title: "Hidratação meta 3.5L", done: 0 }
  ],
  recados: [
    { id: 1, text: "Troca de escala do fim de semana confirmada", date: "Hoje" },
    { id: 2, text: "Manutenção do armamento realizada", date: "Ontem" }
  ]
};

class HavocBaseApp {
  constructor() {
    this.currentScreen = 1;
    this.wallpaperUrl = DEFAULT_WALLPAPER;
    this.wallpaperDim = localStorage.getItem('havoc_wallpaper_dim') || '0.25';
    this.pendingWallpaperUrl = null;
    
    try {
      this.currentFinMonth = this.getCurrentMonthKey();
    } catch (e) {
      this.currentFinMonth = '2026-10';
    }
    this.currentFinType = 'entrada';
    this.currentFinFilter = 'todos';
    this.isDraggingApp = false;

    // Estado dos Treinos
    this.treinoOpTab = 'tfm';
    this.orthoView = 'ficha';
    this.orthoMuscle = 'Todos';

    // Recupera dados salvos do usuário
    try {
      this.financeiro = JSON.parse(localStorage.getItem('havoc_financeiro')) || [];
      if (!Array.isArray(this.financeiro)) this.financeiro = [];
      const dummyDescs = ['salário base', 'aluguel & condomínio', 'internet fibra', 'financiamento', 'equipamento operacional', 'auxílio fardamento'];
      this.financeiro = this.financeiro.filter(f => f && typeof f === 'object' && !dummyDescs.includes(String(f.desc || '').toLowerCase().trim()));
    } catch (e) {
      this.financeiro = [];
    }

    try {
      this.tarefas = JSON.parse(localStorage.getItem('havoc_tarefas')) || INITIAL_DATA.tarefas;
      if (!Array.isArray(this.tarefas)) this.tarefas = INITIAL_DATA.tarefas;
      this.tarefas = this.tarefas.filter(t => t && typeof t === 'object');
    } catch (e) {
      this.tarefas = INITIAL_DATA.tarefas;
    }

    try {
      this.recados = JSON.parse(localStorage.getItem('havoc_recados')) || INITIAL_DATA.recados;
      if (!Array.isArray(this.recados)) this.recados = INITIAL_DATA.recados;
      this.recados = this.recados.filter(r => r && typeof r === 'object');
    } catch (e) {
      this.recados = INITIAL_DATA.recados;
    }

    this.ensureFinanceiroData();
    this.init();
  }

  init() {
    try { this.setupClock(); } catch (e) {}
    try { this.setupNavigation(); } catch (e) {}
    try { this.applyWallpaper(this.wallpaperUrl); } catch (e) {}
    try { this.applyWallpaperDim(this.wallpaperDim); } catch (e) {}
    try { this.loadQuoteOnStart(); } catch (e) {}
    try { this.restoreAppsOrder(); } catch (e) {}
    try { this.setupDragAndDrop(); } catch (e) {}
    try { this.setupAppLauncher(); } catch (e) {}
    try { this.setupToolModals(); } catch (e) {}
    try { this.setupMonthNavigator(); } catch (e) {}
    try { this.setupFinanceiroForm(); } catch (e) {}
    try { this.setupWallpaperModal(); } catch (e) {}
    try { this.updateBadges(); } catch (e) {}
  }

  getCurrentMonthKey(date = new Date()) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }

  formatMonthTitle(monthKey) {
    if (!monthKey || typeof monthKey !== 'string' || !monthKey.includes('-')) return 'Mês Atual';
    const [year, month] = monthKey.split('-').map(Number);
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mName = months[month - 1] || 'Mês';
    return `${mName} de ${year}`;
  }

  addMonthsToKey(monthKey, n) {
    if (!monthKey || typeof monthKey !== 'string' || !monthKey.includes('-')) {
      monthKey = this.getCurrentMonthKey();
    }
    const [year, month] = monthKey.split('-').map(Number);
    const targetDate = new Date(year, (month - 1) + n, 1);
    const y = targetDate.getFullYear();
    const m = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }

  ensureFinanceiroData() {
    const currentKey = this.getCurrentMonthKey();
    let modified = false;
    this.financeiro.forEach(item => {
      if (!item || typeof item !== 'object') return;
      if (!item.month) {
        item.month = currentKey;
        modified = true;
      }
      if (typeof item.pago !== 'boolean') {
        item.pago = item.type === 'entrada';
        modified = true;
      }
    });
    if (modified) this.saveFinanceiro();
  }

  async loadQuoteOnStart() {
    const todayKey = new Date().toISOString().slice(0, 10);
    const savedDate = localStorage.getItem('havoc_daily_quote_date');
    const savedQuote = localStorage.getItem('havoc_daily_quote_data');

    if (savedDate === todayKey && savedQuote) {
      try {
        const parsed = JSON.parse(savedQuote);
        if (parsed && parsed.text) {
          this.renderQuote(parsed);
          return;
        }
      } catch (e) {}
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const deterministicQuote = BACKUP_QUOTES[dayOfYear % BACKUP_QUOTES.length];

    try {
      localStorage.setItem('havoc_daily_quote_date', todayKey);
      localStorage.setItem('havoc_daily_quote_data', JSON.stringify(deterministicQuote));
    } catch (e) {}

    this.renderQuote(deterministicQuote);
  }

  renderQuote(quote) {
    const textEl = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const categoryEl = document.getElementById('quote-category');

    if (textEl) textEl.textContent = `"${quote.text}"`;
    if (authorEl) authorEl.textContent = quote.author;

    if (categoryEl) {
      let icon = '🛡️';
      let label = 'HAVOC BASE • DISCIPLINA';
      if (quote.category === 'biblico') {
        icon = '📖';
        label = 'VERSÍCULO DO DIA';
      } else if (quote.category === 'goggins') {
        icon = '⚡';
        label = 'MENTALIDADE RESILIENTE';
      }
      categoryEl.innerHTML = `${icon} <span>${label}</span>`;
    }
  }

  setupNavigation() {
    const welcomeScreen = document.getElementById('screen-welcome');
    const btnEnter = document.getElementById('btn-enter-dashboard');
    const btnBack = document.getElementById('btn-back-welcome');

    const goToDashboard = () => {
      welcomeScreen.classList.add('slide-out');
      this.currentScreen = 2;
    };

    const goToWelcome = () => {
      welcomeScreen.classList.remove('slide-out');
      this.currentScreen = 1;
    };

    if (btnEnter) btnEnter.addEventListener('click', goToDashboard);
    if (btnBack) btnBack.addEventListener('click', goToWelcome);

    window.addEventListener('keydown', (e) => {
      if (this.currentScreen === 1) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
          e.preventDefault();
          goToDashboard();
        }
      } else if (this.currentScreen === 2) {
        if (e.code === 'Escape') {
          goToWelcome();
        }
      }
    });

    let startY = 0;
    welcomeScreen.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    welcomeScreen.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      if (startY - endY > 60) {
        goToDashboard();
      }
    }, { passive: true });
  }

  setupAppLauncher() {
    // App 3: Financeiro
    document.getElementById('btn-open-financeiro')?.addEventListener('click', () => {
      this.renderFinanceiro();
      document.getElementById('modal-financeiro')?.classList.add('active');
    });

    // App 4: Tarefas
    document.getElementById('btn-open-tarefas')?.addEventListener('click', () => {
      this.renderTarefas();
      document.getElementById('modal-tarefas')?.classList.add('active');
    });

    // App 5: Recados
    document.getElementById('btn-open-recados')?.addEventListener('click', () => {
      this.renderRecados();
      document.getElementById('modal-recados')?.classList.add('active');
    });
  }

  setupToolModals() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        const statusEl = document.getElementById('storage-status-text');
        if (statusEl) {
          statusEl.textContent = granted ? 'Persistência no Navegador: ATIVADA' : 'Armazenamento Local: ATIVO';
        }
      }).catch(() => {});
    }

    document.querySelectorAll('.btn-close-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close');
        document.getElementById(modalId)?.classList.remove('active');
        this.updateBadges();
      });
    });

    // Modal Backup
    document.getElementById('btn-open-backup-modal')?.addEventListener('click', () => {
      document.getElementById('modal-backup')?.classList.add('active');
    });

    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
      this.exportBackup();
    });

    const restoreInput = document.getElementById('input-restore-backup');
    document.getElementById('btn-trigger-restore')?.addEventListener('click', () => {
      restoreInput?.click();
    });

    restoreInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.importBackup(event.target.result);
        };
        reader.readAsText(file);
      }
    });

    document.getElementById('btn-save-tarefa')?.addEventListener('click', () => {
      const input = document.getElementById('input-new-tarefa');
      if (input && input.value.trim()) {
        this.tarefas.unshift({ id: Date.now(), title: input.value.trim(), done: 0 });
        input.value = '';
        this.renderTarefas();
        localStorage.setItem('havoc_tarefas', JSON.stringify(this.tarefas));
        this.updateBadges();
      }
    });

    document.getElementById('btn-save-recado')?.addEventListener('click', () => {
      const input = document.getElementById('input-new-recado');
      if (input && input.value.trim()) {
        this.recados.unshift({ id: Date.now(), text: input.value.trim(), date: 'Agora' });
        input.value = '';
        this.renderRecados();
        localStorage.setItem('havoc_recados', JSON.stringify(this.recados));
      }
    });
  }

  // ==========================================
  // BACKUP E SINCRONIZAÇÃO TOTAL
  // ==========================================
  exportBackup() {
    try {
      const backupData = {
        version: "havoc_v7",
        timestamp: new Date().toISOString(),
        financeiro: this.financeiro,
        tarefas: this.tarefas,
        recados: this.recados,
        wallpaperUrl: this.wallpaperUrl,
        wallpaperDim: this.wallpaperDim,
        appsOrder: JSON.parse(localStorage.getItem('havoc_apps_order') || '[]')
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `havoc_base_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao exportar backup:', e);
      alert('Erro ao gerar arquivo de backup.');
    }
  }

  importBackup(jsonString) {
    const feedbackEl = document.getElementById('restore-feedback-msg');
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') throw new Error('Formato inválido');

      if (Array.isArray(data.financeiro)) {
        this.financeiro = data.financeiro;
        this.saveFinanceiro();
      }
      if (Array.isArray(data.tarefas)) {
        this.tarefas = data.tarefas;
        localStorage.setItem('havoc_tarefas', JSON.stringify(this.tarefas));
      }
      if (Array.isArray(data.recados)) {
        this.recados = data.recados;
        localStorage.setItem('havoc_recados', JSON.stringify(this.recados));
      }
      if (data.wallpaperUrl) {
        this.applyWallpaper(data.wallpaperUrl);
      }
      if (Array.isArray(data.appsOrder)) {
        localStorage.setItem('havoc_apps_order', JSON.stringify(data.appsOrder));
        this.restoreAppsOrder();
      }

      this.renderFinanceiro();
      this.renderTarefas();
      this.renderRecados();
      this.updateBadges();

      if (feedbackEl) {
        feedbackEl.textContent = '✓ Dados restaurados com sucesso absoluto!';
        feedbackEl.style.color = '#4ade80';
        feedbackEl.style.display = 'block';
      }
    } catch (e) {
      if (feedbackEl) {
        feedbackEl.textContent = '⚠️ Erro ao importar: arquivo inválido.';
        feedbackEl.style.color = '#f87171';
        feedbackEl.style.display = 'block';
      }
    }
  }

  // ==========================================
  // GESTÃO AVANÇADA DE FINANÇAS & CONTAS
  // ==========================================
  parseMoney(raw) {
    if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
    if (!raw) return 0;
    let s = String(raw).trim();
    s = s.replace(/[R$\s]/gi, '');
    if (s.includes('.') && s.includes(',')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  showFinFeedback(msg, isError = false) {
    const el = document.getElementById('fin-form-msg');
    if (!el) return;
    el.textContent = msg;
    el.className = `fin-form-feedback ${isError ? 'feedback-error' : 'feedback-success'}`;
    el.style.display = 'block';
    if (this._finFeedbackTimer) clearTimeout(this._finFeedbackTimer);
    this._finFeedbackTimer = setTimeout(() => {
      el.style.display = 'none';
    }, 3200);
  }

  saveFinanceiro() {
    try {
      localStorage.setItem('havoc_financeiro', JSON.stringify(this.financeiro));
    } catch (e) {
      console.warn('Erro ao persistir financeiro:', e);
    }
  }

  setupMonthNavigator() {
    const btnPrev = document.getElementById('btn-fin-prev-month');
    const btnNext = document.getElementById('btn-fin-next-month');
    const btnToday = document.getElementById('btn-fin-today-month');
    const selectTarget = document.getElementById('input-fin-target-month');

    const updateMonthDisplay = () => {
      const displayEl = document.getElementById('fin-month-display');
      if (displayEl) {
        displayEl.textContent = this.formatMonthTitle(this.currentFinMonth);
      }
    };

    const populateTargetMonthSelect = () => {
      if (!selectTarget) return;
      selectTarget.innerHTML = '';
      const currentKey = this.getCurrentMonthKey();
      for (let i = -2; i <= 18; i++) {
        const mKey = this.addMonthsToKey(currentKey, i);
        const opt = document.createElement('option');
        opt.value = mKey;
        opt.textContent = this.formatMonthTitle(mKey) + (mKey === currentKey ? ' (Atual)' : '');
        if (mKey === this.currentFinMonth) {
          opt.selected = true;
        }
        selectTarget.appendChild(opt);
      }
    };

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        this.currentFinMonth = this.addMonthsToKey(this.currentFinMonth, -1);
        updateMonthDisplay();
        populateTargetMonthSelect();
        this.renderFinanceiro();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        this.currentFinMonth = this.addMonthsToKey(this.currentFinMonth, 1);
        updateMonthDisplay();
        populateTargetMonthSelect();
        this.renderFinanceiro();
      });
    }

    if (btnToday) {
      btnToday.addEventListener('click', () => {
        this.currentFinMonth = this.getCurrentMonthKey();
        updateMonthDisplay();
        populateTargetMonthSelect();
        this.renderFinanceiro();
      });
    }

    if (selectTarget) {
      selectTarget.addEventListener('change', () => {
        this.currentFinMonth = selectTarget.value;
        updateMonthDisplay();
        this.renderFinanceiro();
      });
    }

    updateMonthDisplay();
    populateTargetMonthSelect();
  }

  togglePagoFinanceiro(id) {
    const item = this.financeiro.find(f => f.id === id);
    if (!item) return;

    item.pago = !item.pago;
    this.saveFinanceiro();
    this.renderFinanceiro();
    this.updateBadges();

    const statusTxt = item.pago ? 'PAGA (riscada)' : 'marcada como PENDENTE';
    this.showFinFeedback(`✓ "${item.desc}" ${statusTxt}!`);
  }

  setupFinanceiroForm() {
    const typeButtons = document.querySelectorAll('.btn-fin-type');
    const parcelasBox = document.getElementById('finance-parcelas-row');
    const fixaRepeatRow = document.getElementById('fin-fixa-repeat-row');

    const selectType = (type) => {
      this.currentFinType = type || 'entrada';
      typeButtons.forEach(b => {
        if (b.getAttribute('data-type') === this.currentFinType) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      if (this.currentFinType === 'parcelada') {
        if (parcelasBox) parcelasBox.style.display = 'flex';
        if (fixaRepeatRow) fixaRepeatRow.style.display = 'none';
      } else if (this.currentFinType === 'saida' || this.currentFinType === 'fixa') {
        if (parcelasBox) parcelasBox.style.display = 'none';
        if (fixaRepeatRow) fixaRepeatRow.style.display = 'flex';
      } else {
        if (parcelasBox) parcelasBox.style.display = 'none';
        if (fixaRepeatRow) fixaRepeatRow.style.display = 'none';
      }
    };

    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        selectType(btn.getAttribute('data-type'));
      });
    });

    // Parcelas Inteligentes
    const inputTotalDebt = document.getElementById('input-fin-total-debt');
    const inputTotalParc = document.getElementById('input-fin-total-parc');
    const inputParcAmount = document.getElementById('input-fin-parc-amount');
    const inputPaidParc = document.getElementById('input-fin-paid-parc');
    const summaryHint = document.getElementById('fin-parc-summary-hint');
    const selectTarget = document.getElementById('input-fin-target-month');

    const updateSmartInstallmentSummary = () => {
      if (!summaryHint) return;
      const debt = this.parseMoney(inputTotalDebt?.value);
      const totalP = parseInt(inputTotalParc?.value) || 0;
      const parcVal = this.parseMoney(inputParcAmount?.value);
      const paidP = parseInt(inputPaidParc?.value) || 0;
      const startMonth = selectTarget?.value || this.currentFinMonth;

      if (totalP <= 0) {
        summaryHint.textContent = 'Informe a quantidade total de parcelas (ex: 10).';
        return;
      }

      const remainingP = Math.max(0, totalP - paidP);
      if (remainingP === 0) {
        summaryHint.innerHTML = '🎉 <strong>Esta dívida já está 100% quitada!</strong> Nenhuma parcela futura pendente.';
        return;
      }

      const firstParcNum = paidP + 1;
      const lastMonth = this.addMonthsToKey(startMonth, remainingP - 1);
      const firstMonthTitle = this.formatMonthTitle(startMonth);
      const lastMonthTitle = this.formatMonthTitle(lastMonth);
      const formattedParcVal = parcVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedTotalDebt = (parcVal * totalP || debt).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      summaryHint.innerHTML = `
        💡 <strong>${remainingP} parcelas de R$ ${formattedParcVal}</strong> (Total: R$ ${formattedTotalDebt}).<br>
        Distribuídas da <strong>parcela ${firstParcNum}/${totalP} (${firstMonthTitle})</strong> até a <strong>parcela ${totalP}/${totalP} (${lastMonthTitle})</strong>.<br>
        <span style="color:var(--green-ops); font-weight:700;">✓ Debitará apenas R$ ${formattedParcVal} em cada mês!</span>
      `;
    };

    inputTotalDebt?.addEventListener('input', () => {
      const debt = this.parseMoney(inputTotalDebt.value);
      const totalP = parseInt(inputTotalParc?.value) || 0;
      if (debt > 0 && totalP > 0 && inputParcAmount) {
        inputParcAmount.value = (debt / totalP).toFixed(2).replace('.', ',');
      }
      updateSmartInstallmentSummary();
    });

    inputTotalParc?.addEventListener('input', () => {
      const totalP = parseInt(inputTotalParc.value) || 0;
      const debt = this.parseMoney(inputTotalDebt?.value);
      if (debt > 0 && totalP > 0 && inputParcAmount) {
        inputParcAmount.value = (debt / totalP).toFixed(2).replace('.', ',');
      }
      updateSmartInstallmentSummary();
    });

    inputParcAmount?.addEventListener('input', () => {
      const parcVal = this.parseMoney(inputParcAmount.value);
      const totalP = parseInt(inputTotalParc?.value) || 0;
      if (parcVal > 0 && totalP > 0 && inputTotalDebt) {
        inputTotalDebt.value = (parcVal * totalP).toFixed(2).replace('.', ',');
      }
      updateSmartInstallmentSummary();
    });

    inputPaidParc?.addEventListener('input', updateSmartInstallmentSummary);
    selectTarget?.addEventListener('change', updateSmartInstallmentSummary);

    // Botão Zerar Lançamentos
    document.getElementById('btn-reset-financeiro')?.addEventListener('click', () => {
      if (confirm('Deseja zerar os lançamentos financeiros para começar limpo?')) {
        this.financeiro = [];
        this.saveFinanceiro();
        this.renderFinanceiro();
        this.updateBadges();
        this.showFinFeedback('✓ Lançamentos zerados!');
      }
    });

    // Abas de Filtro
    const filterButtons = document.querySelectorAll('.fin-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFinFilter = btn.getAttribute('data-filter') || 'todos';
        this.renderFinanceiro();
      });
    });

    // Salvar Lançamento
    const btnSave = document.getElementById('btn-save-financeiro');
    const inputDesc = document.getElementById('input-fin-desc');
    const inputAmount = document.getElementById('input-fin-amount');

    const saveEntry = () => {
      const type = this.currentFinType || 'entrada';
      const targetMonth = selectTarget?.value || this.currentFinMonth;
      let desc = inputDesc?.value.trim();

      if (type === 'parcelada') {
        const debt = this.parseMoney(inputTotalDebt?.value);
        const totalP = parseInt(inputTotalParc?.value) || 1;
        let parcVal = this.parseMoney(inputParcAmount?.value);
        const paidP = parseInt(inputPaidParc?.value) || 0;

        if (parcVal <= 0 && debt > 0) parcVal = debt / totalP;
        if (parcVal <= 0) {
          this.showFinFeedback('⚠️ Digite o valor da parcela ou o total da dívida.', true);
          return;
        }

        if (paidP >= totalP) {
          this.showFinFeedback('⚠️ Todas as parcelas já foram pagas! Ajuste a quantidade.', true);
          return;
        }

        if (!desc) desc = 'Dívida Parcelada';
        const remainingCount = totalP - paidP;
        const baseId = Date.now();

        for (let i = 0; i < remainingCount; i++) {
          const parcNum = paidP + 1 + i;
          const monthKey = this.addMonthsToKey(targetMonth, i);
          this.financeiro.push({
            id: baseId + i,
            desc: desc,
            amount: parcVal,
            totalDebt: debt || (parcVal * totalP),
            type: 'parcelada',
            totalParc: totalP,
            currentParc: parcNum,
            month: monthKey,
            pago: false,
            date: `Parcela ${parcNum}/${totalP}`
          });
        }

        this.saveFinanceiro();
        if (inputDesc) inputDesc.value = '';
        if (inputTotalDebt) inputTotalDebt.value = '';
        if (inputParcAmount) inputParcAmount.value = '';
        if (inputPaidParc) inputPaidParc.value = '0';

        this.currentFinMonth = targetMonth;
        this.renderFinanceiro();
        this.updateBadges();

        const formattedParc = parcVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        this.showFinFeedback(`✓ "${desc}": ${remainingCount} parcelas de R$ ${formattedParc} distribuídas nos meses seguintes!`);
        return;
      }

      // Caso Entrada ou Saída Normal
      const rawVal = inputAmount ? inputAmount.value : '';
      const amount = this.parseMoney(rawVal);

      if (amount <= 0) {
        this.showFinFeedback('⚠️ Digite um valor válido maior que zero.', true);
        return;
      }

      if (!desc) {
        desc = type === 'entrada' ? 'Entrada' : 'Saída';
      }

      const repeatFixa = (type === 'saida' || type === 'fixa') && document.getElementById('input-fin-repeat-fixa')?.checked;
      const baseId = Date.now();

      if (repeatFixa) {
        for (let i = 0; i < 12; i++) {
          const monthKey = this.addMonthsToKey(targetMonth, i);
          this.financeiro.push({
            id: baseId + i,
            desc: desc,
            amount: amount,
            type: 'saida',
            month: monthKey,
            pago: false,
            date: 'Saída Recorrente'
          });
        }
      } else {
        this.financeiro.push({
          id: baseId,
          desc: desc,
          amount: amount,
          type: type,
          month: targetMonth,
          pago: type === 'entrada',
          date: type === 'entrada' ? 'Entrada' : 'Saída'
        });
      }

      this.saveFinanceiro();
      if (inputDesc) inputDesc.value = '';
      if (inputAmount) inputAmount.value = '';

      this.currentFinMonth = targetMonth;
      this.renderFinanceiro();
      this.updateBadges();

      const formatted = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      this.showFinFeedback(`✓ "${desc}" de R$ ${formatted} lançado em ${this.formatMonthTitle(targetMonth)}!`);
    };

    if (btnSave) btnSave.addEventListener('click', saveEntry);

    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEntry();
      }
    };
    inputDesc?.addEventListener('keydown', handleEnter);
    inputAmount?.addEventListener('keydown', handleEnter);
  }

  renderFinanceiro() {
    const c = document.getElementById('financeiro-items-container');
    const balanceEl = document.getElementById('modal-fin-balance');
    const incEl = document.getElementById('modal-fin-income');
    const expEl = document.getElementById('modal-fin-expense');
    const monthDisplay = document.getElementById('fin-month-display');

    if (monthDisplay) {
      monthDisplay.textContent = this.formatMonthTitle(this.currentFinMonth);
    }

    const activeMonthKey = this.currentFinMonth || this.getCurrentMonthKey();
    const monthItems = this.financeiro.filter(f => (f.month || this.getCurrentMonthKey()) === activeMonthKey);

    let totalEntradas = 0;
    let totalContas = 0;

    monthItems.forEach(f => {
      const val = Math.abs(this.parseMoney(f.amount));
      if (f.type === 'entrada') {
        totalEntradas += val;
      } else {
        totalContas += val;
      }
    });

    const sobra = totalEntradas - totalContas;

    if (incEl) incEl.textContent = `+R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (expEl) expEl.textContent = `-R$ ${totalContas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (balanceEl) {
      balanceEl.textContent = `R$ ${sobra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      balanceEl.className = `stat-val ${sobra >= 0 ? 'val-green' : 'val-red'}`;
    }

    if (!c) return;

    let list = monthItems;
    if (this.currentFinFilter === 'pendente') {
      list = monthItems.filter(f => !f.pago && f.type !== 'entrada');
    } else if (this.currentFinFilter === 'pago') {
      list = monthItems.filter(f => f.pago);
    } else if (this.currentFinFilter === 'saida') {
      list = monthItems.filter(f => f.type !== 'entrada');
    } else if (this.currentFinFilter === 'entrada') {
      list = monthItems.filter(f => f.type === 'entrada');
    }

    if (list.length === 0) {
      c.innerHTML = `
        <div style="text-align:center; padding:35px 10px; color:var(--text-muted); font-size:0.82rem;">
          Nenhum lançamento em <strong>${this.formatMonthTitle(activeMonthKey)}</strong>.<br>
          Adicione entradas ou saídas no formulário abaixo.
        </div>
      `;
      return;
    }

    c.innerHTML = list.map(f => {
      const isEntrada = f.type === 'entrada';
      const isParcelada = f.type === 'parcelada';
      const isPago = !!f.pago;

      let typeBadge = '';
      if (isEntrada) {
        typeBadge = `<span class="fin-item-badge fin-badge-entrada">▲ ENTRADA</span>`;
      } else if (isParcelada) {
        typeBadge = `<span class="fin-item-badge fin-badge-parcelada">💳 ${f.currentParc}/${f.totalParc}</span>`;
      } else {
        typeBadge = `<span class="fin-item-badge fin-badge-fixa">▼ SAÍDA</span>`;
      }

      const statusBadge = isPago
        ? `<span class="fin-item-badge fin-badge-pago">✓ PAGA</span>`
        : `<span class="fin-item-badge fin-badge-pendente">⏳ A PAGAR</span>`;

      const valNumber = Math.abs(this.parseMoney(f.amount));
      const formattedVal = `${isEntrada ? '+' : '-'} R$ ${valNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      return `
        <div class="list-item ${isPago ? 'pago-item' : ''}">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <div class="fin-item-checkbox ${isPago ? 'checked' : ''}" onclick="app.togglePagoFinanceiro(${f.id})" title="${isPago ? 'Desmarcar como pago' : 'Marcar como paga'}">
              ${isPago ? '✓' : ''}
            </div>

            <div style="flex:1;">
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                <span class="fin-item-title" style="font-weight:700; font-size:0.88rem; color:#fff;">${f.desc}</span>
                ${typeBadge}
                ${!isEntrada ? statusBadge : ''}
              </div>
              <div class="fin-item-amount" style="font-size:0.78rem; color:${isEntrada ? 'var(--green-ops)' : (isPago ? 'var(--text-muted)' : 'var(--red-ops)')}; font-weight:700; margin-top:2px;">
                ${formattedVal}
              </div>
              ${isParcelada ? `<div class="fin-parc-status">Parcela ${f.currentParc} de ${f.totalParc} deste mês</div>` : ''}
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <button class="btn-icon-minimal" onclick="app.removeFinanceiro(${f.id})" style="width:28px;height:28px;font-size:0.75rem;" title="Excluir lançamento">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  removeFinanceiro(id) {
    this.financeiro = this.financeiro.filter(f => f.id !== id);
    this.saveFinanceiro();
    this.renderFinanceiro();
    this.updateBadges();
  }

  renderTarefas() {
    const c = document.getElementById('tarefas-items-container');
    if (!c) return;
    c.innerHTML = this.tarefas.map(t => `
      <div class="list-item ${t.done ? 'completed' : ''}">
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="tactical-checkbox ${t.done ? 'checked' : ''}" onclick="app.toggleTarefa(${t.id})"></div>
          <span style="font-size:0.85rem; color:#fff;">${t.title}</span>
        </div>
        <button class="btn-icon-minimal" onclick="app.removeTarefa(${t.id})" style="width:28px;height:28px;font-size:0.75rem;">✕</button>
      </div>
    `).join('');
  }

  toggleTarefa(id) {
    const t = this.tarefas.find(x => x.id === id);
    if (t) t.done = t.done ? 0 : 1;
    this.renderTarefas();
    localStorage.setItem('havoc_tarefas', JSON.stringify(this.tarefas));
    this.updateBadges();
  }

  removeTarefa(id) {
    this.tarefas = this.tarefas.filter(t => t.id !== id);
    this.renderTarefas();
    localStorage.setItem('havoc_tarefas', JSON.stringify(this.tarefas));
    this.updateBadges();
  }

  renderRecados() {
    const c = document.getElementById('recados-items-container');
    if (!c) return;
    c.innerHTML = this.recados.map(r => `
      <div class="list-item">
        <div>
          <div style="font-size:0.85rem; color:#fff;">${r.text}</div>
          <div style="font-size:0.7rem; color:var(--text-muted);">${r.date}</div>
        </div>
        <button class="btn-icon-minimal" onclick="app.removeRecado(${r.id})" style="width:28px;height:28px;font-size:0.75rem;">✕</button>
      </div>
    `).join('');
  }

  removeRecado(id) {
    this.recados = this.recados.filter(r => r.id !== id);
    this.renderRecados();
    localStorage.setItem('havoc_recados', JSON.stringify(this.recados));
  }

  updateBadges() {
    const finBadge = document.getElementById('badge-financeiro');
    if (finBadge) {
      let inc = 0, exp = 0;
      const currentMonthKey = this.getCurrentMonthKey();
      this.financeiro.forEach(f => {
        if ((f.month || currentMonthKey) === currentMonthKey) {
          if (f.type === 'entrada') inc += Math.abs(this.parseMoney(f.amount));
          else exp += Math.abs(this.parseMoney(f.amount));
        }
      });
      const sobra = inc - exp;
      finBadge.textContent = sobra >= 0 ? `Sobra R$ ${Math.round(sobra)}` : `Déficit R$ ${Math.round(Math.abs(sobra))}`;
      finBadge.className = `app-card-badge ${sobra >= 0 ? 'status-green' : 'status-red'}`;
    }

    const tarBadge = document.getElementById('badge-tarefas');
    if (tarBadge) {
      const active = this.tarefas.filter(t => !t.done).length;
      tarBadge.textContent = `${active} Ativas`;
    }
  }

  restoreAppsOrder() {
    const savedOrder = JSON.parse(localStorage.getItem('havoc_apps_order'));
    if (!savedOrder || !Array.isArray(savedOrder)) return;

    const grid = document.getElementById('apps-launcher-grid');
    if (!grid) return;

    savedOrder.forEach(appId => {
      const card = grid.querySelector(`[data-app-id="${appId}"]`);
      if (card) {
        grid.appendChild(card);
      }
    });
  }

  saveAppsOrder() {
    const grid = document.getElementById('apps-launcher-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.app-icon-card');
    const order = Array.from(cards).map(c => c.getAttribute('data-app-id')).filter(Boolean);
    localStorage.setItem('havoc_apps_order', JSON.stringify(order));
  }

  setupDragAndDrop() {
    const grid = document.getElementById('apps-launcher-grid');
    if (!grid) return;

    let draggedItem = null;
    let justDragged = false;

    const attachCardEvents = (card) => {
      card.addEventListener('dragstart', (e) => {
        draggedItem = card;
        justDragged = true;
        this.isDraggingApp = true;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.getAttribute('data-app-id'));
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      card.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (card !== draggedItem) card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (draggedItem && draggedItem !== card) {
          const allCards = Array.from(grid.querySelectorAll('.app-icon-card'));
          const draggedIdx = allCards.indexOf(draggedItem);
          const targetIdx = allCards.indexOf(card);

          if (draggedIdx < targetIdx) {
            grid.insertBefore(draggedItem, card.nextSibling);
          } else {
            grid.insertBefore(draggedItem, card);
          }
          this.saveAppsOrder();
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        grid.querySelectorAll('.app-icon-card').forEach(c => c.classList.remove('drag-over'));
        draggedItem = null;
        setTimeout(() => { this.isDraggingApp = false; }, 50);
      });

      card.addEventListener('click', (e) => {
        if (justDragged) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    };

    grid.querySelectorAll('.app-icon-card').forEach(attachCardEvents);
  }

  setupClock() {
    const clockEl = document.getElementById('live-clock');
    const welcomeClock = document.getElementById('welcome-live-clock');
    const welcomeDate = document.getElementById('welcome-live-date');
    const update = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour12: false });
      const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (clockEl) clockEl.textContent = timeStr;
      if (welcomeClock) welcomeClock.textContent = timeStr;
      if (welcomeDate) welcomeDate.textContent = dateStr;
    };
    update();
    setInterval(update, 1000);
  }

  applyWallpaper(url) {
    if (!url) return;
    this.wallpaperUrl = url;
    try { localStorage.setItem('havoc_wallpaper_url', url); } catch (e) {}
    const el = document.getElementById('wallpaper-element');
    if (el) el.style.backgroundImage = `url('${url}')`;
  }

  applyWallpaperDim(dim) {
    this.wallpaperDim = dim;
    try { localStorage.setItem('havoc_wallpaper_dim', dim); } catch (e) {}
    document.documentElement.style.setProperty('--wallpaper-dim', dim);
  }

  setupWallpaperModal() {
    const modal = document.getElementById('wallpaper-modal');
    const btnOpen = document.getElementById('btn-open-wallpaper-modal');
    const btnCancel = document.getElementById('btn-modal-cancel');
    const btnSave = document.getElementById('btn-modal-save');
    const btnReset = document.getElementById('btn-reset-wallpaper');
    const inputUrl = document.getElementById('wallpaper-input-url');
    const inputFile = document.getElementById('wallpaper-file-input');
    const statusLabel = document.getElementById('file-chosen-status');
    const previewBox = document.getElementById('wallpaper-preview-box');
    const previewImg = document.getElementById('wallpaper-preview-img');
    const dimSlider = document.getElementById('wallpaper-dim-slider');
    const dimValLabel = document.getElementById('dim-val-label');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        this.pendingWallpaperUrl = null;
        if (inputUrl) inputUrl.value = this.wallpaperUrl.startsWith('data:') ? '' : this.wallpaperUrl;
        if (statusLabel) statusLabel.textContent = this.wallpaperUrl.startsWith('data:') ? 'Foto personalizada do celular em uso' : 'Nenhuma foto nova selecionada';
        if (dimSlider) dimSlider.value = Math.round(parseFloat(this.wallpaperDim) * 100);
        if (dimValLabel) dimValLabel.textContent = `${Math.round(parseFloat(this.wallpaperDim) * 100)}%`;
        if (previewBox && previewImg) {
          previewImg.src = this.wallpaperUrl;
          previewBox.style.display = 'block';
        }
        modal.classList.add('active');
      });
    }

    if (dimSlider && dimValLabel) {
      dimSlider.addEventListener('input', () => {
        const pct = dimSlider.value;
        dimValLabel.textContent = `${pct}%`;
        this.applyWallpaperDim((pct / 100).toFixed(2));
      });
    }

    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (statusLabel) statusLabel.textContent = `Foto: ${file.name}`;
          const reader = new FileReader();
          reader.onload = (event) => {
            this.pendingWallpaperUrl = event.target.result;
            if (previewBox && previewImg) {
              previewImg.src = this.pendingWallpaperUrl;
              previewBox.style.display = 'block';
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (inputUrl) {
      inputUrl.addEventListener('input', () => {
        const val = inputUrl.value.trim();
        if (val) {
          this.pendingWallpaperUrl = val;
          if (previewBox && previewImg) {
            previewImg.src = val;
            previewBox.style.display = 'block';
          }
        }
      });
    }

    if (btnCancel) btnCancel.addEventListener('click', () => modal.classList.remove('active'));

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.applyWallpaper(DEFAULT_WALLPAPER);
        modal.classList.remove('active');
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const chosen = this.pendingWallpaperUrl || inputUrl?.value.trim();
        if (chosen) this.applyWallpaper(chosen);
        modal.classList.remove('active');
      });
    }
  }
}

function bootHavocApp() {
  if (!window.app) {
    try {
      window.app = new HavocBaseApp();
    } catch (err) {
      console.error("Erro ao iniciar HavocBaseApp:", err);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootHavocApp);
} else {
  bootHavocApp();
}
window.addEventListener('load', bootHavocApp);
