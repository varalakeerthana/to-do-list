/* ============================================================
   TODOS — Frontend Logic
   Backend: Express + PostgreSQL
   Routes: GET/POST/PUT/DELETE /todos, DELETE /todos/:id
   ============================================================ */

const API = 'http://localhost:3000';

let todos         = [];
let currentFilter = 'all';

// ── Bootstrap ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  bindToggleText('completedToggle', 'toggleText');
  bindToggleText('editCompleted',   'editToggleText');
});

// ── API helpers ───────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error || 'Request failed');
  return data;
}

// ── Status indicator ──────────────────────────────────────────
function setStatus(ok) {
  const dot   = document.getElementById('statusDot');
  const label = document.getElementById('statusLabel');
  if (ok) {
    dot.className   = 'status-dot ok';
    label.textContent = 'connected';
  } else {
    dot.className   = 'status-dot err';
    label.textContent = 'offline';
  }
}

// ── Load all todos ────────────────────────────────────────────
async function loadTodos() {
  showSkeleton(true);
  try {
    const data = await api('GET', '/todos');
    todos = data;
    setStatus(true);
    renderTodos();
  } catch (err) {
    setStatus(false);
    showSkeleton(false);
    showToast('Cannot reach server. Is it running?', 'err');
  }
}

// ── Add todo ──────────────────────────────────────────────────
async function addTodo() {
  const descEl = document.getElementById('taskInput');
  const compEl = document.getElementById('completedToggle');
  const btn    = document.getElementById('addBtn');
  const msgEl  = document.getElementById('formMsg');

  const desc      = descEl.value.trim();
  const completed = compEl.checked;

  setFormMsg('', '');
  if (!desc) { setFormMsg('Description cannot be empty.', 'err'); return; }

  btn.disabled = true;
  btn.querySelector('.btn-label').textContent = 'ADDING…';

  try {
    const newTodo = await api('POST', '/todos', { desc, completed });
    // Server returns the row + extra msg fields
    todos.unshift(newTodo);
    descEl.value  = '';
    compEl.checked = false;
    updateToggleText('toggleText', false);
    setFormMsg('Task added!', 'ok');
    renderTodos();
    showToast('Task added successfully', 'ok');
    setTimeout(() => setFormMsg('', ''), 2500);
  } catch (err) {
    setFormMsg(err.message, 'err');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-label').textContent = 'ADD TASK';
  }
}

// ── Toggle completed inline (checkbox click) ──────────────────
async function toggleTodo(id) {
  const todo = todos.find(t => t.todo_id === id);
  if (!todo) return;

  const newCompleted = !todo.todo_completed;

  // Optimistic update
  todo.todo_completed = newCompleted;
  renderTodos();

  try {
    await api('PUT', `/todos/${id}`, { desc: todo.todo_desc, completed: newCompleted });
    showToast(newCompleted ? 'Marked as done ✓' : 'Marked as pending', 'ok');
  } catch (err) {
    // Rollback
    todo.todo_completed = !newCompleted;
    renderTodos();
    showToast('Could not update task.', 'err');
  }
}

// ── Open edit modal ───────────────────────────────────────────
function openEdit(id) {
  const todo = todos.find(t => t.todo_id === id);
  if (!todo) return;

  document.getElementById('editId').value        = id;
  document.getElementById('editDesc').value      = todo.todo_desc;
  document.getElementById('editCompleted').checked = todo.todo_completed;
  updateToggleText('editToggleText', todo.todo_completed);
  document.getElementById('modalMsg').textContent = '';
  document.getElementById('modalMsg').className  = 'form-msg';

  openModal('modalOverlay');
  setTimeout(() => document.getElementById('editDesc').focus(), 80);
}

// ── Save edit ─────────────────────────────────────────────────
async function saveEdit() {
  const id        = parseInt(document.getElementById('editId').value);
  const desc      = document.getElementById('editDesc').value.trim();
  const completed = document.getElementById('editCompleted').checked;
  const saveBtn   = document.querySelector('.btn-save');
  const msgEl     = document.getElementById('modalMsg');

  msgEl.textContent = '';
  if (!desc) { msgEl.textContent = 'Description cannot be empty.'; msgEl.className = 'form-msg err'; return; }

  saveBtn.disabled = true;
  saveBtn.textContent = 'SAVING…';

  try {
    const updated = await api('PUT', `/todos/${id}`, { desc, completed });
    // Update local state
    const idx = todos.findIndex(t => t.todo_id === id);
    if (idx !== -1) {
      todos[idx] = Array.isArray(updated) ? updated[0] : updated;
    }
    closeModal();
    renderTodos();
    showToast('Task updated', 'ok');
  } catch (err) {
    msgEl.textContent = err.message;
    msgEl.className   = 'form-msg err';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'SAVE CHANGES →';
  }
}

// ── Delete one todo ───────────────────────────────────────────
function deleteTodo(id) {
  openConfirm(
    'Delete this task? This cannot be undone.',
    async () => {
      try {
        console.log("Deleting todo:", id);
        await api('DELETE', `/todos/${id}`);
        todos = todos.filter(t => t.todo_id !== Number(id));
        renderTodos();
        showToast('Task deleted', 'info');
      } catch (err) {
        showToast('Could not delete task.', 'err');
      }
    }
  );
}

// ── Clear all todos ───────────────────────────────────────────
function confirmClearAll() {
  if (todos.length === 0) { showToast('No tasks to clear.', 'info'); return; }
  openConfirm(
    `Delete ALL ${todos.length} task(s)? This cannot be undone.`,
    async () => {
      try {
        await api('DELETE', '/todos');
        todos = [];
        renderTodos();
        showToast('All tasks cleared', 'info');
      } catch (err) {
        showToast('Could not clear tasks.', 'err');
      }
    }
  );
}

// ── Filter ────────────────────────────────────────────────────
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTodos();
}

// ── Render ────────────────────────────────────────────────────
function renderTodos() {
  showSkeleton(false);

  const list    = document.getElementById('todoList');
  const empty   = document.getElementById('emptyState');

  // Stats (always from full list)
  const total   = todos.length;
  const done    = todos.filter(t => t.todo_completed).length;
  const pending = total - done;
  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statDone').textContent    = done;
  document.getElementById('statPending').textContent = pending;

  // Filter
  const filtered = todos.filter(t => {
    if (currentFilter === 'done')    return  t.todo_completed;
    if (currentFilter === 'pending') return !t.todo_completed;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    const msgs = {
      all:     { icon: '◈', title: 'NO TASKS YET',       sub: 'Add your first task above.' },
      done:    { icon: '◎', title: 'NOTHING COMPLETED',   sub: 'Check off tasks to see them here.' },
      pending: { icon: '●', title: 'ALL DONE!',           sub: 'No pending tasks remaining.' },
    };
    const m = msgs[currentFilter];
    empty.innerHTML = `
      <div class="empty-icon">${m.icon}</div>
      <div class="empty-title">${m.title}</div>
      <div class="empty-sub">${m.sub}</div>`;
    return;
  }

  empty.classList.add('hidden');
  list.innerHTML = filtered.map(todo => buildTodoHTML(todo)).join('');
}

function buildTodoHTML(todo) {
  const id        = todo.todo_id;
  const desc      = escapeHTML(todo.todo_desc || '');
  const completed = todo.todo_completed;
  const doneClass = completed ? 'is-done' : '';
  const checkMark = completed ? '✓' : '';
  const badge     = completed
    ? '<span class="todo-badge done">DONE</span>'
    : '<span class="todo-badge pending">PENDING</span>';

  return `
    <div class="todo-item ${doneClass}" id="item-${id}">
      <button class="todo-check-btn" onclick="toggleTodo(${id})" title="${completed ? 'Mark pending' : 'Mark done'}" aria-label="Toggle status">
        ${checkMark}
      </button>
      <div class="todo-body">
        <div class="todo-desc">${desc}</div>
        <div class="todo-meta">ID #${id}${badge}</div>
      </div>
      <div class="todo-actions">
        <button class="action-btn edit"   onclick="openEdit(${id})">EDIT</button>
        <button class="action-btn delete" onclick="deleteTodo(${id})">DELETE</button>
      </div>
    </div>`;
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

let confirmCallback = null;

function openConfirm(message, cb) {
  confirmCallback = cb;
  document.getElementById('confirmText').textContent = message;
  document.getElementById('confirmOkBtn').onclick = async () => {
    closeConfirm();
    if (confirmCallback) await confirmCallback();
  };
  openModal('confirmOverlay');
}

function closeConfirm(e) {
  if (e && e.target !== document.getElementById('confirmOverlay')) return;
  document.getElementById('confirmOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  confirmCallback = null;
}

// Close modals on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
  }
  // Submit add form on Enter (when input focused)
  if (e.key === 'Enter' && document.activeElement === document.getElementById('taskInput')) {
    addTodo();
  }
});

// ── Toggle text labels ────────────────────────────────────────
function bindToggleText(checkboxId, labelId) {
  document.getElementById(checkboxId).addEventListener('change', function () {
    updateToggleText(labelId, this.checked);
  });
}

function updateToggleText(labelId, checked) {
  const el = document.getElementById(labelId);
  if (!el) return;
  el.textContent = checked ? 'DONE' : 'PENDING';
  el.style.color = checked ? 'var(--done)' : 'var(--text-muted)';
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

// ── Form message ──────────────────────────────────────────────
function setFormMsg(msg, type) {
  const el = document.getElementById('formMsg');
  el.textContent = msg;
  el.className   = type ? `form-msg ${type}` : 'form-msg';
}

// ── Skeleton ──────────────────────────────────────────────────
function showSkeleton(show) {
  const sk = document.getElementById('skeleton');
  if (!sk) return;
  sk.style.display = show ? 'flex' : 'none';
  if (show) sk.style.flexDirection = 'column';
}

// ── HTML escape ───────────────────────────────────────────────
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
