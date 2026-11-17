const form = document.querySelector('form'), input = document.querySelector('#task');
const add = form.querySelector('button'), list = document.querySelector('ul');
const alert = document.querySelector('[role=alert]'), retry = document.querySelector('#retry');
let tasks = [], retryAction;
async function api(path = '', options = {}) {
  const response = await fetch(`/api/tasks${path}`, {
    ...options, headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Request failed');
  return response.status === 204 ? undefined : response.json();
}
function clearError() { alert.hidden = true; alert.textContent = ''; retry.hidden = true; retryAction = undefined; }
async function attempt(action, message) {
  clearError();
  try { await action(); }
  catch { alert.textContent = message; alert.hidden = false; retry.hidden = false; retryAction = () => attempt(action, message); }
}
retry.onclick = () => retryAction?.();
function render() {
  const ids = new Set(tasks.map(task => task.id));
  for (const child of [...list.children]) if (!ids.has(child.dataset.id)) child.remove();
  for (const task of tasks) {
    let li = [...list.children].find(child => child.dataset.id === task.id);
    if (!li) {
      li = document.createElement('li'); li.dataset.id = task.id;
      const label = document.createElement('label'), box = document.createElement('input');
      const span = document.createElement('span'), remove = document.createElement('button');
      box.type = 'checkbox'; label.append(box, span); remove.textContent = 'Delete';
      box.onchange = () => {
        const completed = box.checked;
        attempt(async () => {
          const focused = document.activeElement === box;
          box.disabled = true;
          try {
            const saved = await api(`/${task.id}`, { method: 'PATCH', body: JSON.stringify({ completed }) });
            task.completed = saved.completed; render();
          } finally { box.checked = task.completed; box.disabled = false; if (focused) box.focus(); }
        }, 'Could not update task. Try again.');
      };
      remove.onclick = () => attempt(async () => {
        remove.disabled = true;
        try { await api(`/${task.id}`, { method: 'DELETE' }); tasks = tasks.filter(item => item.id !== task.id); render(); }
        finally { remove.disabled = false; }
      }, 'Could not delete task. Try again.');
      li.append(label, remove); list.append(li);
    }
    li.querySelector('span').textContent = task.text;
    li.querySelector('input').checked = task.completed;
    li.querySelector('button').setAttribute('aria-label', `Delete ${task.text}`);
  }
  document.querySelector('[role=status]').textContent = `${tasks.filter(task => !task.completed).length} tasks remaining`;
}
form.onsubmit = event => {
  event.preventDefault();
  const text = input.value.trim(); if (!text) return;
  // Reuse this ID on Retry so an uncertain network result cannot create a duplicate.
  const id = crypto.randomUUID();
  attempt(async () => {
    add.disabled = true; input.disabled = true; form.setAttribute('aria-busy', 'true');
    try {
      const saved = await api('', { method: 'POST', body: JSON.stringify({ id, text }) });
      if (!tasks.some(task => task.id === saved.id)) tasks.push(saved);
      input.value = ''; render();
    } finally { add.disabled = false; input.disabled = false; form.removeAttribute('aria-busy'); }
  }, 'Could not save task. Try again.');
};
function load() {
  return attempt(async () => {
    add.disabled = true; input.disabled = true; form.setAttribute('aria-busy', 'true');
    try { tasks = await api(); render(); }
    finally { add.disabled = false; input.disabled = false; form.removeAttribute('aria-busy'); }
  }, 'Could not load tasks. Try again.');
}
load();
