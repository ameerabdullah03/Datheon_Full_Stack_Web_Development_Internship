const STORAGE_KEY = 'daymark.tasks.v1';
let tasks = loadTasks();
let statusFilter = 'all';
let categoryFilter = 'All';
let searchTerm = '';
let editingId = null;

const $ = (selector, root = document) => root.querySelector(selector);
const list = $('#task-list');
const form = $('#task-form');
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter(task => task && typeof task.id === 'string' && typeof task.title === 'string').map(task => ({
      id: task.id, title: task.title.slice(0, 120), category: ['Work','Personal','Study'].includes(task.category) ? task.category : 'Personal',
      due: typeof task.due === 'string' ? task.due : '', done: Boolean(task.done), order: Number.isFinite(task.order) ? task.order : 0, created: Number(task.created) || Date.now()
    })) : [];
  } catch { return []; }
}
function saveTasks() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { $('#footer-summary').textContent = 'Storage is unavailable in this browser.'; } }
function localDate(date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,10); }
function dateLabel(value) {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`); const today = new Date(`${localDate(new Date())}T00:00:00`);
  const delta = Math.round((d - today) / 86400000);
  const label = delta === 0 ? 'Today' : delta === 1 ? 'Tomorrow' : delta === -1 ? 'Yesterday' : d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  return {label, overdue: delta < 0};
}
function render() {
  const visible = tasks.filter(t => (statusFilter === 'all' || (statusFilter === 'active' ? !t.done : t.done)) && (categoryFilter === 'All' || t.category === categoryFilter) && t.title.toLocaleLowerCase().includes(searchTerm));
  visible.sort((a,b) => a.order - b.order || a.created - b.created);
  list.innerHTML = visible.map(task => {
    const due = dateLabel(task.due);
    return `<li class="task-item ${task.done ? 'done' : ''}" data-id="${esc(task.id)}" draggable="true"><button class="task-check" type="button" aria-label="${task.done ? 'Mark active' : 'Mark complete'}: ${esc(task.title)}">✓</button><div class="task-body"><div class="task-title">${esc(task.title)}</div><div class="task-meta"><span class="category-pill">${esc(task.category)}</span>${due ? `<span class="due-date ${due.overdue && !task.done ? 'overdue' : ''}">${esc(due.label)}</span>` : ''}</div></div><div class="task-actions"><button class="task-action edit" type="button" aria-label="Edit ${esc(task.title)}" title="Edit">✎</button><button class="task-action delete" type="button" aria-label="Delete ${esc(task.title)}" title="Delete">×</button></div><span class="drag-handle" aria-hidden="true">⠿</span></li>`;
  }).join('');
  $('#empty-state').hidden = visible.length > 0;
  if (!visible.length) {
    const searching = searchTerm || categoryFilter !== 'All' || statusFilter !== 'all';
    $('#empty-title').textContent = searching ? 'Nothing in this view.' : 'A clear page.';
    $('#empty-copy').textContent = searching ? 'Try another filter or search for something else.' : 'Add your first task and give your day a little direction.';
  }
  const done = tasks.filter(t => t.done).length, active = tasks.length - done;
  $('#task-count').textContent = `${tasks.length} ${tasks.length === 1 ? 'TASK' : 'TASKS'}`;
  $('#all-count').textContent = tasks.length; $('#active-count').textContent = active; $('#completed-count').textContent = done;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $('#progress-label').textContent = `${percent}%`; $('#progress-bar').style.width = `${percent}%`;
  $('#progress-caption').textContent = percent === 100 && tasks.length ? 'Everything done. Beautifully.' : done ? `${done} of ${tasks.length} tasks complete. Keep going.` : 'A fresh start. You\'ve got this.';
  $('#footer-summary').textContent = active ? `${active} ${active === 1 ? 'task' : 'tasks'} left to make happen.` : tasks.length ? 'All done. Take a moment to enjoy it.' : 'A little progress goes a long way.';
  $('#clear-completed').hidden = done === 0;
}
function makeId() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
form.addEventListener('submit', event => {
  event.preventDefault(); const data = new FormData(form); const title = String(data.get('title') || '').trim(); if (!title) return;
  tasks.push({id:makeId(), title, category:String(data.get('category')), due:String(data.get('due') || ''), done:false, order:tasks.length ? Math.max(...tasks.map(t => t.order)) + 1 : 0, created:Date.now()});
  saveTasks(); form.reset(); $('#task-title').focus(); render();
});
list.addEventListener('click', event => {
  const row = event.target.closest('.task-item'); if (!row) return; const task = tasks.find(t => t.id === row.dataset.id); if (!task) return;
  if (event.target.closest('.task-check')) task.done = !task.done;
  else if (event.target.closest('.delete')) { row.classList.add('removing'); setTimeout(() => { tasks = tasks.filter(t => t.id !== task.id); saveTasks(); render(); }, 180); return; }
  else if (event.target.closest('.edit')) { openEdit(task); return; }
  saveTasks(); render();
});
function openEdit(task) { editingId = task.id; $('#edit-title').value = task.title; $('#edit-category').value = task.category; $('#edit-due').value = task.due; $('#edit-dialog').showModal(); $('#edit-title').focus(); }
$('#edit-form').addEventListener('submit', event => { event.preventDefault(); const task = tasks.find(t => t.id === editingId); if (!task) return; const data = new FormData(event.currentTarget); task.title = String(data.get('title')).trim(); task.category = String(data.get('category')); task.due = String(data.get('due') || ''); saveTasks(); $('#edit-dialog').close(); render(); });
$('.close-dialog').addEventListener('click', () => $('#edit-dialog').close()); $('.cancel-button').addEventListener('click', () => $('#edit-dialog').close());
$('#edit-dialog').addEventListener('click', event => { if (event.target === $('#edit-dialog')) $('#edit-dialog').close(); });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { statusFilter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); }); render(); }));
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { categoryFilter = button.dataset.category; document.querySelectorAll('[data-category]').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); }); render(); }));
$('#search-input').addEventListener('input', event => { searchTerm = event.target.value.trim().toLocaleLowerCase(); render(); });
$('#clear-completed').addEventListener('click', () => { tasks = tasks.filter(t => !t.done); saveTasks(); render(); });

let draggedId = null;
list.addEventListener('dragstart', event => { const row = event.target.closest('.task-item'); if (!row) return; draggedId = row.dataset.id; row.classList.add('dragging'); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', draggedId); });
list.addEventListener('dragend', event => { event.target.closest('.task-item')?.classList.remove('dragging'); list.querySelectorAll('.drag-over').forEach(row => row.classList.remove('drag-over')); });
list.addEventListener('dragover', event => { const row = event.target.closest('.task-item'); if (!row || row.dataset.id === draggedId) return; event.preventDefault(); list.querySelectorAll('.drag-over').forEach(item => item.classList.remove('drag-over')); row.classList.add('drag-over'); });
list.addEventListener('drop', event => {
  const target = event.target.closest('.task-item'); if (!target || !draggedId || target.dataset.id === draggedId) return; event.preventDefault();
  const ordered = [...list.querySelectorAll('.task-item')].map(row => row.dataset.id); const from = ordered.indexOf(draggedId), to = ordered.indexOf(target.dataset.id); if (from < 0 || to < 0) return;
  ordered.splice(to,0,ordered.splice(from,1)[0]); ordered.forEach((id,index) => { const task = tasks.find(t => t.id === id); if (task) task.order = index; }); saveTasks(); render();
});

const themeButton = $('#theme-button');
if (localStorage.getItem('daymark.theme') === 'dark') document.body.classList.add('dark');
function updateTheme() { const dark = document.body.classList.contains('dark'); themeButton.textContent = dark ? '☼' : '☾'; themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); }
updateTheme(); themeButton.addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('daymark.theme', document.body.classList.contains('dark') ? 'dark' : 'light'); updateTheme(); });
$('#today-label').textContent = new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}).toUpperCase();
render();
