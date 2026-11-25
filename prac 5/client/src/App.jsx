import { useEffect, useState } from 'react';

const emptyTask = { title: '', description: '', priority: 'medium' };
const priorities = ['low', 'medium', 'high'];

class ApiError extends Error {
  constructor(message, details = {}, isNetworkError = false) {
    super(message);
    this.details = details;
    this.isNetworkError = isNetworkError;
  }
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
  } catch {
    throw new ApiError('The API is not reachable.', {}, true);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(
      body?.error?.message || 'The request could not be completed.',
      body?.error?.details || {}
    );
  }
  return body;
}

function validateTask(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'A title is required.';
  if (values.title.length > 120) errors.title = 'Keep the title under 120 characters.';
  if (values.description.length > 1000) errors.description = 'Keep the description under 1000 characters.';
  return errors;
}

function fieldErrors(error) {
  return error.details && typeof error.details === 'object' ? error.details : {};
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [createForm, setCreateForm] = useState(emptyTask);
  const [createErrors, setCreateErrors] = useState({});
  const [createMessage, setCreateMessage] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [doneFilter, setDoneFilter] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [offline, setOffline] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyTask);
  const [editErrors, setEditErrors] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    async function loadTasks() {
      setLoading(true);
      setListError('');
      const params = new URLSearchParams({ page: String(page), limit: '10', sort });
      if (search) params.set('search', search);
      if (doneFilter) params.set('done', doneFilter);
      try {
        const result = await apiRequest(`/api/tasks?${params.toString()}`);
        if (!active) return;
        setTasks(result.data);
        setPagination(result);
        setOffline(false);
      } catch (error) {
        if (!active) return;
        setListError(error.message);
        setOffline(error.isNetworkError);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTasks();
    return () => {
      active = false;
    };
  }, [search, doneFilter, sort, page]);

  useEffect(() => {
    let active = true;
    async function checkHealth() {
      try {
        const result = await apiRequest('/api/health');
        if (active) setOffline(result?.status !== 'ok' || result?.db !== 'connected');
      } catch {
        if (active) setOffline(true);
      }
    }
    checkHealth();
    const interval = window.setInterval(checkHealth, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  function updateCreateField(field, value) {
    setCreateForm((current) => ({ ...current, [field]: value }));
    setCreateErrors((current) => ({ ...current, [field]: '' }));
    setCreateMessage('');
  }

  async function handleCreate(event) {
    event.preventDefault();
    const validationErrors = validateTask(createForm);
    if (Object.keys(validationErrors).length) {
      setCreateErrors(validationErrors);
      return;
    }
    setCreateMessage('');
    try {
      await apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify(createForm) });
      setCreateForm(emptyTask);
      setCreateErrors({});
      setCreateMessage('Task created.');
      setPage(1);
      setSearch((current) => current);
      const params = new URLSearchParams({ page: '1', limit: '10', sort });
      if (search) params.set('search', search);
      if (doneFilter) params.set('done', doneFilter);
      const result = await apiRequest(`/api/tasks?${params.toString()}`);
      setTasks(result.data);
      setPagination(result);
      setOffline(false);
    } catch (error) {
      setOffline(error.isNetworkError);
      setCreateMessage(error.isNetworkError ? '' : error.message);
      setCreateErrors(fieldErrors(error));
    }
  }

  function beginEdit(task) {
    setEditingId(task._id);
    setEditForm({ title: task.title, description: task.description, priority: task.priority });
    setEditErrors({});
    setActionError('');
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditErrors((current) => ({ ...current, [field]: '' }));
  }

  async function saveEdit(task) {
    const validationErrors = validateTask(editForm);
    if (Object.keys(validationErrors).length) {
      setEditErrors(validationErrors);
      return;
    }
    try {
      const updated = await apiRequest(`/api/tasks/${task._id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...editForm, done: task.done })
      });
      setTasks((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setEditingId(null);
      setEditErrors({});
      setOffline(false);
    } catch (error) {
      setOffline(error.isNetworkError);
      setEditErrors(fieldErrors(error));
      setActionError(error.isNetworkError ? error.message : '');
    }
  }

  async function toggleDone(task) {
    setActionError('');
    try {
      const updated = await apiRequest(`/api/tasks/${task._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ done: !task.done })
      });
      setTasks((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setOffline(false);
    } catch (error) {
      setOffline(error.isNetworkError);
      setActionError(error.message);
    }
  }

  async function deleteTask(taskId) {
    if (deleteConfirmId !== taskId) {
      setDeleteConfirmId(taskId);
      return;
    }
    setActionError('');
    try {
      await apiRequest(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks((current) => current.filter((task) => task._id !== taskId));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      setDeleteConfirmId(null);
      setOffline(false);
    } catch (error) {
      setOffline(error.isNetworkError);
      setActionError(error.message);
    }
  }

  function setFilter(value) {
    setDoneFilter(value);
    setPage(1);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">PERSONAL WORKSPACE</p>
          <h1>Task manager</h1>
          <p className="hero-copy">Keep the important work moving, one clear next step at a time.</p>
        </div>
        <div className="hero-mark" aria-hidden="true"><span>✓</span></div>
      </header>

      {offline && (
        <div className="offline-banner" role="alert">
          <span className="status-dot" /> The API is not running. Your changes will be available when the connection comes back.
        </div>
      )}

      <section className="create-card panel" aria-labelledby="create-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NEW ITEM</p>
            <h2 id="create-heading">Add a task</h2>
          </div>
          <span className="task-count">{pagination.total} total</span>
        </div>
        <form onSubmit={handleCreate} noValidate>
          <div className="form-grid">
            <label className="field field-title">
              Title
              <input
                value={createForm.title}
                onChange={(event) => updateCreateField('title', event.target.value)}
                placeholder="What needs to happen?"
                maxLength={120}
                aria-invalid={Boolean(createErrors.title)}
              />
              {createErrors.title && <span className="field-error">{createErrors.title}</span>}
            </label>
            <label className="field">
              Priority
              <select value={createForm.priority} onChange={(event) => updateCreateField('priority', event.target.value)}>
                {priorities.map((priority) => <option key={priority} value={priority}>{priority[0].toUpperCase() + priority.slice(1)}</option>)}
              </select>
            </label>
            <label className="field field-description">
              Description <span className="optional">Optional</span>
              <textarea
                value={createForm.description}
                onChange={(event) => updateCreateField('description', event.target.value)}
                placeholder="Add context or a useful detail"
                maxLength={1000}
                rows={2}
                aria-invalid={Boolean(createErrors.description)}
              />
              {createErrors.description && <span className="field-error">{createErrors.description}</span>}
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">Add task</button>
            {createMessage && <span className={createMessage === 'Task created.' ? 'success-message' : 'form-error'}>{createMessage}</span>}
          </div>
        </form>
      </section>

      <section className="workspace panel" aria-labelledby="tasks-heading">
        <div className="section-heading list-heading">
          <div>
            <p className="eyebrow">YOUR WORK</p>
            <h2 id="tasks-heading">Tasks</h2>
          </div>
          <div className="list-summary">{pagination.total ? `${pagination.total} ${pagination.total === 1 ? 'task' : 'tasks'}` : 'Clear list'}</div>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <span className="sr-only">Search tasks</span>
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search tasks" />
          </label>
          <div className="filter-group" aria-label="Task status filter">
            {[['', 'All'], ['false', 'Active'], ['true', 'Done']].map(([value, label]) => (
              <button key={value || 'all'} className={doneFilter === value ? 'filter-button active' : 'filter-button'} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <label className="sort-field">
            <span>Sort</span>
            <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
              <option value="-createdAt">Newest</option>
              <option value="createdAt">Oldest</option>
              <option value="updatedAt">Recently updated</option>
              <option value="title">Title A–Z</option>
              <option value="priority">Priority</option>
            </select>
          </label>
        </div>

        {listError && !offline && <div className="inline-error" role="alert">{listError}</div>}
        {actionError && <div className="inline-error" role="alert">{actionError}</div>}

        {loading ? (
          <div className="state-message"><span className="spinner" /> Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">✓</div>
            <h3>No tasks yet</h3>
            <p>Add your first task above and start making progress.</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                isEditing={editingId === task._id}
                editForm={editForm}
                editErrors={editErrors}
                isDeleting={deleteConfirmId === task._id}
                onBeginEdit={beginEdit}
                onCancelEdit={() => { setEditingId(null); setEditErrors({}); }}
                onUpdateEditField={updateEditField}
                onSaveEdit={saveEdit}
                onToggleDone={toggleDone}
                onDelete={deleteTask}
                onCancelDelete={() => setDeleteConfirmId(null)}
              />
            ))}
          </div>
        )}

        <div className="pagination">
          <span>Page {page} of {Math.max(1, pagination.totalPages)}</span>
          <div>
            <button className="secondary-button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <button className="secondary-button" disabled={page >= pagination.totalPages || loading || pagination.totalPages === 0} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function TaskRow({ task, isEditing, editForm, editErrors, isDeleting, onBeginEdit, onCancelEdit, onUpdateEditField, onSaveEdit, onToggleDone, onDelete, onCancelDelete }) {
  return (
    <article className={task.done ? 'task-row completed' : 'task-row'}>
      <div className="task-check-wrap">
        <input className="task-check" type="checkbox" checked={task.done} onChange={() => onToggleDone(task)} aria-label={`Mark ${task.title} as ${task.done ? 'active' : 'done'}`} />
      </div>
      {isEditing ? (
        <div className="edit-content">
          <div className="edit-fields">
            <label className="field">Title<input value={editForm.title} onChange={(event) => onUpdateEditField('title', event.target.value)} maxLength={120} autoFocus />{editErrors.title && <span className="field-error">{editErrors.title}</span>}</label>
            <label className="field">Priority<select value={editForm.priority} onChange={(event) => onUpdateEditField('priority', event.target.value)}>{priorities.map((priority) => <option key={priority} value={priority}>{priority[0].toUpperCase() + priority.slice(1)}</option>)}</select></label>
            <label className="field edit-description">Description<textarea value={editForm.description} onChange={(event) => onUpdateEditField('description', event.target.value)} maxLength={1000} rows={2} />{editErrors.description && <span className="field-error">{editErrors.description}</span>}</label>
          </div>
          <div className="row-actions"><button className="primary-button small-button" onClick={() => onSaveEdit(task)}>Save</button><button className="text-button" onClick={onCancelEdit}>Cancel</button></div>
        </div>
      ) : (
        <div className="task-content">
          <div className="task-topline">
            <h3>{task.title}</h3>
            <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
          </div>
          {task.description && <p>{task.description}</p>}
          <time dateTime={task.createdAt}>Added {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time>
        </div>
      )}
      {!isEditing && <div className="row-actions">
        <button className="text-button" onClick={() => onBeginEdit(task)}>Edit</button>
        {isDeleting ? <><button className="danger-button" onClick={() => onDelete(task._id)}>Confirm</button><button className="text-button" onClick={onCancelDelete}>Cancel</button></> : <button className="text-button delete-button" onClick={() => onDelete(task._id)}>Delete</button>}
      </div>}
    </article>
  );
}

export default App;
