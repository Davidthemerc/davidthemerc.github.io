'use strict';

const STORAGE_KEY = 'loteriaDrawTrackerData';
const THEME_KEY = 'loteriaDrawTrackerTheme';
const CURRENT_VERSION = 1;

const CARDS = [
  'El Gallo','El Diablito','La Dama','El Catrín','El Paraguas','La Sirena','La Escalera','La Botella','El Barril','El Árbol','El Melón','El Valiente','El Gorrito','La Muerte','La Pera','La Bandera','El Bandolón','El Violoncello','La Garza','El Pájaro','La Mano','La Bota','La Luna','El Cotorro','El Borracho','El Negrito','El Corazón','La Sandía','El Tambor','El Camarón','Las Jaras','El Músico','La Araña','El Soldado','La Estrella','El Cazo','El Mundo','El Apache','El Nopal','El Alacrán','La Rosa','La Calavera','La Campana','El Cantarito','El Venado','El Sol','La Corona','La Chalupa','El Pino','El Pescado','La Palma','La Maceta','El Arpa','La Rana'
].map((name, index) => ({ number: index + 1, name }));

let state = loadState();
let currentDraw = [];
let editingGameId = null;
let pendingConfirmAction = null;
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const elements = {
  cardGrid: $('#cardGrid'), cardSearch: $('#cardSearch'), drawOrder: $('#drawOrder'), drawCount: $('#drawCount'),
  drawSummary: $('#drawSummary'), currentGameTitle: $('#currentGameTitle'), undoButton: $('#undoButton'),
  saveGameButton: $('#saveGameButton'), clearCurrentButton: $('#clearCurrentButton'), historyList: $('#historyList'),
  historySummary: $('#historySummary'), topCards: $('#topCards'), firstCards: $('#firstCards'), lastCards: $('#lastCards'),
  averagePositions: $('#averagePositions'), statsTableBody: $('#statsTableBody'), statsSort: $('#statsSort'),
  statGames: $('#statGames'), statDraws: $('#statDraws'), statAverage: $('#statAverage'), statUnique: $('#statUnique'),
  settingsGameCount: $('#settingsGameCount'), storageSize: $('#storageSize'), storageVersion: $('#storageVersion'),
  importInput: $('#importInput'), confirmDialog: $('#confirmDialog'), dialogTitle: $('#dialogTitle'),
  dialogMessage: $('#dialogMessage'), dialogConfirm: $('#dialogConfirm'), toast: $('#toast')
};

function defaultState() { return { version: CURRENT_VERSION, games: [] }; }

function validateState(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.games)) return false;
  return data.games.every(game => game && typeof game.id === 'string' && typeof game.createdAt === 'string' && Array.isArray(game.cards) && game.cards.every(n => Number.isInteger(n) && n >= 1 && n <= 54));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    if (!validateState(parsed)) throw new Error('Invalid data structure');
    if (!parsed.version) parsed.version = 1;
    return migrateState(parsed);
  } catch (error) {
    console.error('Stored data could not be loaded:', error);
    setTimeout(() => showToast('Stored data appears corrupted. Use Settings to export or reset.'), 0);
    return defaultState();
  }
}

function migrateState(data) {
  const migrated = structuredClone(data);
  migrated.version = CURRENT_VERSION;
  return migrated;
}

function saveState() {
  state.version = CURRENT_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function renderCardGrid(filter = '') {
  const normalized = filter.trim().toLocaleLowerCase();
  const selected = new Set(currentDraw);
  const cards = CARDS.filter(card => card.name.toLocaleLowerCase().includes(normalized) || String(card.number).includes(normalized));
  elements.cardGrid.innerHTML = cards.length ? cards.map(card => `
    <button class="card-button ${selected.has(card.number) ? 'selected' : ''}" type="button" data-card="${card.number}" ${selected.has(card.number) ? 'disabled' : ''}>
      <span class="card-number">#${card.number}</span><span class="card-name">${card.name}</span>
    </button>`).join('') : '<p class="muted">No matching cards.</p>';
}

function renderCurrentDraw() {
  elements.drawCount.textContent = currentDraw.length;
  elements.drawSummary.textContent = currentDraw.length ? `${currentDraw.length} card${currentDraw.length === 1 ? '' : 's'} entered in draw order.` : 'Tap cards below in the order they are drawn.';
  elements.currentGameTitle.textContent = editingGameId ? 'Edit saved game' : 'New draw';
  elements.undoButton.disabled = currentDraw.length === 0;
  elements.saveGameButton.disabled = currentDraw.length === 0;
  elements.clearCurrentButton.disabled = currentDraw.length === 0;
  elements.saveGameButton.textContent = editingGameId ? 'Update game' : 'Save game';
  elements.drawOrder.innerHTML = currentDraw.length ? currentDraw.map((number, index) => `<li><span class="position">${index + 1}</span>${cardName(number)}</li>`).join('') : '<li class="empty-message">No cards recorded yet.</li>';
  renderCardGrid(elements.cardSearch.value);
}

function cardName(number) { return CARDS[number - 1]?.name ?? `Card ${number}`; }
function newId() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

function addCard(number) {
  if (!currentDraw.includes(number)) {
    currentDraw.push(number);
    renderCurrentDraw();
    requestAnimationFrame(() => { elements.drawOrder.scrollLeft = elements.drawOrder.scrollWidth; });
  }
}

function saveGame() {
  if (!currentDraw.length) return;
  if (editingGameId) {
    const game = state.games.find(item => item.id === editingGameId);
    if (game) {
      game.cards = [...currentDraw];
      game.updatedAt = new Date().toISOString();
    }
    showToast('Game updated.');
  } else {
    state.games.unshift({ id: newId(), createdAt: new Date().toISOString(), cards: [...currentDraw] });
    showToast('Game saved.');
  }
  currentDraw = [];
  editingGameId = null;
  saveState();
}

function renderHistory() {
  const games = state.games;
  elements.historySummary.textContent = games.length ? `${games.length} saved game${games.length === 1 ? '' : 's'}.` : 'No games saved yet.';
  elements.historyList.innerHTML = games.length ? games.map((game, index) => `
    <details class="history-item">
      <summary><div class="history-meta"><strong>Game ${games.length - index}</strong><span>${formatDate(game.createdAt)}${game.updatedAt ? ' · edited' : ''}</span></div><span class="history-count">${game.cards.length} cards</span></summary>
      <div class="history-content">
        <ol class="history-cards">${game.cards.map((n, i) => `<li>${i + 1}. ${cardName(n)}</li>`).join('')}</ol>
        <div class="hero-actions"><button class="button secondary edit-game" data-id="${game.id}" type="button">Edit</button><button class="button danger delete-game" data-id="${game.id}" type="button">Delete</button></div>
      </div>
    </details>`).join('') : '<p class="muted">Save your first draw to see it here.</p>';
}

function calculateStats() {
  const totalGames = state.games.length;
  const rows = CARDS.map(card => ({ ...card, count: 0, gamesSeen: 0, positions: [], first: 0, last: 0 }));
  let totalDraws = 0;
  state.games.forEach(game => {
    totalDraws += game.cards.length;
    const seen = new Set();
    game.cards.forEach((number, index) => {
      const row = rows[number - 1];
      row.count++;
      row.positions.push(index + 1);
      seen.add(number);
      if (index === 0) row.first++;
      if (index === game.cards.length - 1) row.last++;
    });
    seen.forEach(number => rows[number - 1].gamesSeen++);
  });
  rows.forEach(row => {
    row.rate = totalGames ? (row.gamesSeen / totalGames) * 100 : 0;
    row.avgPosition = row.positions.length ? row.positions.reduce((a,b) => a+b, 0) / row.positions.length : null;
  });
  return { totalGames, totalDraws, rows };
}

function rankingHtml(rows, valueKey, formatter, subtitle) {
  const filtered = rows.filter(row => row[valueKey] !== null && row[valueKey] > 0).slice(0, 5);
  if (!filtered.length) return '<p class="muted">Not enough data yet.</p>';
  return filtered.map((row, index) => `<div class="rank-row"><span class="rank-number">${index + 1}</span><div class="rank-label"><strong>${row.name}</strong><span>#${row.number}${subtitle ? ` · ${subtitle(row)}` : ''}</span></div><div class="rank-value">${formatter(row[valueKey])}</div></div>`).join('');
}

function renderStats() {
  const stats = calculateStats();
  elements.statGames.textContent = stats.totalGames;
  elements.statDraws.textContent = stats.totalDraws;
  elements.statAverage.textContent = stats.totalGames ? (stats.totalDraws / stats.totalGames).toFixed(1) : '0';
  elements.statUnique.textContent = stats.rows.filter(row => row.count > 0).length;
  const byCount = [...stats.rows].sort((a,b) => b.count - a.count || a.number - b.number);
  const byFirst = [...stats.rows].sort((a,b) => b.first - a.first || a.number - b.number);
  const byLast = [...stats.rows].sort((a,b) => b.last - a.last || a.number - b.number);
  const byPosition = [...stats.rows].filter(r => r.avgPosition !== null).sort((a,b) => a.avgPosition - b.avgPosition || b.count - a.count);
  elements.topCards.innerHTML = rankingHtml(byCount, 'count', v => `${v}×`, r => `${r.rate.toFixed(0)}% of games`);
  elements.firstCards.innerHTML = rankingHtml(byFirst, 'first', v => `${v}×`, r => `${stats.totalGames ? (r.first/stats.totalGames*100).toFixed(0) : 0}% of games`);
  elements.lastCards.innerHTML = rankingHtml(byLast, 'last', v => `${v}×`, r => `${stats.totalGames ? (r.last/stats.totalGames*100).toFixed(0) : 0}% of games`);
  elements.averagePositions.innerHTML = rankingHtml(byPosition, 'avgPosition', v => `#${v.toFixed(1)}`, r => `${r.count} draw${r.count === 1 ? '' : 's'}`);
  renderStatsTable(stats.rows, elements.statsSort.value);
}

function renderStatsTable(rows, sortMode) {
  const sorted = [...rows].sort((a,b) => {
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    if (sortMode === 'rate') return b.rate - a.rate || b.count - a.count;
    if (sortMode === 'position') return (a.avgPosition ?? Infinity) - (b.avgPosition ?? Infinity) || b.count - a.count;
    return b.count - a.count || a.number - b.number;
  });
  elements.statsTableBody.innerHTML = sorted.map(row => `<tr><td><strong>${row.name}</strong> <span class="muted">#${row.number}</span></td><td>${row.count}</td><td>${row.gamesSeen}</td><td>${row.rate.toFixed(1)}%</td><td>${row.avgPosition === null ? '—' : row.avgPosition.toFixed(1)}</td></tr>`).join('');
}

function renderSettings() {
  const raw = localStorage.getItem(STORAGE_KEY) || JSON.stringify(state);
  elements.settingsGameCount.textContent = state.games.length;
  elements.storageVersion.textContent = state.version;
  elements.storageSize.textContent = `${(new Blob([raw]).size / 1024).toFixed(1)} KB`;
}

function renderAll() { renderCurrentDraw(); renderHistory(); renderStats(); renderSettings(); }
function formatDate(iso) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); }

function switchView(viewId) {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === viewId));
  document.querySelectorAll('.nav-item').forEach(tab => tab.classList.toggle('active', tab.dataset.view === viewId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function askConfirm(title, message, action, confirmLabel = 'Confirm') {
  pendingConfirmAction = action;
  elements.dialogTitle.textContent = title;
  elements.dialogMessage.textContent = message;
  elements.dialogConfirm.textContent = confirmLabel;
  elements.confirmDialog.showModal();
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2600);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `loteria-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Backup exported.');
}

async function importData(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!validateState(parsed)) throw new Error('The selected file is not a valid Lotería Tracker backup.');
    askConfirm('Replace current data?', `Importing this backup will replace ${state.games.length} current saved game${state.games.length === 1 ? '' : 's'} with ${parsed.games.length}.`, () => {
      state = migrateState(parsed);
      currentDraw = [];
      editingGameId = null;
      saveState();
      showToast('Backup imported.');
    }, 'Import and replace');
  } catch (error) { showToast(error.message || 'Could not import that file.'); }
  finally { elements.importInput.value = ''; }
}

function editGame(id) {
  const game = state.games.find(item => item.id === id);
  if (!game) return;
  currentDraw = [...game.cards];
  editingGameId = id;
  renderCurrentDraw();
  switchView('recordView');
  showToast('Editing saved game.');
}

function deleteGame(id) {
  const game = state.games.find(item => item.id === id);
  if (!game) return;
  askConfirm('Delete this game?', `This will permanently delete the game recorded on ${formatDate(game.createdAt)}.`, () => {
    state.games = state.games.filter(item => item.id !== id);
    if (editingGameId === id) { currentDraw = []; editingGameId = null; }
    saveState();
    showToast('Game deleted.');
  }, 'Delete game');
}

function initializeTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
}

initializeTheme();
renderAll();

document.querySelectorAll('.nav-item').forEach(tab => tab.addEventListener('click', () => switchView(tab.dataset.view)));
elements.cardGrid.addEventListener('click', event => { const button = event.target.closest('[data-card]'); if (button) addCard(Number(button.dataset.card)); });
elements.cardSearch.addEventListener('input', () => renderCardGrid(elements.cardSearch.value));
elements.undoButton.addEventListener('click', () => { currentDraw.pop(); renderCurrentDraw(); });
elements.saveGameButton.addEventListener('click', saveGame);
elements.clearCurrentButton.addEventListener('click', () => askConfirm('Clear current draw?', 'This removes the unsaved cards from the current entry.', () => { currentDraw = []; editingGameId = null; renderCurrentDraw(); showToast('Current draw cleared.'); }, 'Clear draw'));
elements.historyList.addEventListener('click', event => { const edit = event.target.closest('.edit-game'); const del = event.target.closest('.delete-game'); if (edit) editGame(edit.dataset.id); if (del) deleteGame(del.dataset.id); });
elements.statsSort.addEventListener('change', renderStats);
$('#exportButton').addEventListener('click', exportData);
elements.importInput.addEventListener('change', () => { if (elements.importInput.files[0]) importData(elements.importInput.files[0]); });
$('#clearStorageButton').addEventListener('click', () => askConfirm('Delete all local data?', 'Every saved game and the current browser copy will be permanently removed. Export a backup first if you may need it later.', () => { localStorage.removeItem(STORAGE_KEY); state = defaultState(); currentDraw = []; editingGameId = null; renderAll(); showToast('All local data deleted.'); }, 'Delete everything'));
elements.confirmDialog.addEventListener('close', () => { if (elements.confirmDialog.returnValue === 'confirm' && pendingConfirmAction) pendingConfirmAction(); pendingConfirmAction = null; });
$('#themeToggle').addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem(THEME_KEY, next); });
