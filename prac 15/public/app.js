(function () {
  let sb = null;
  let currentLength = 'short';
  let currentNote = null;
  let historyCache = [];

  const $ = (id) => document.getElementById(id);

  const banner = $('banner');
  function showBanner(msg) {
    banner.textContent = msg;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 4000);
  }
  function hideBanner() { banner.classList.add('hidden'); }

  // ---- bootstrap ----
  async function init() {
    let config;
    try {
      const r = await fetch('/api/config');
      config = await r.json();
    } catch (e) {
      showBanner('Could not load app configuration.');
      return;
    }
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      showBanner('Supabase is not configured on the server.');
      return;
    }
    sb = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    setupAuth();
    setupGenerator();
    setupHistory();

    sb.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) showApp(session);
      else showAuth();
    });

    const { data } = await sb.auth.getSession();
    if (data && data.session) showApp(data.session);
    else showAuth();
  }

  function showApp(session) {
    $('authView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    $('userEmail').textContent = session.user.email || '';
    loadHistory();
  }

  function showAuth() {
    $('appView').classList.add('hidden');
    $('authView').classList.remove('hidden');
  }

  // ---- AUTH ----
  let mode = 'login';
  function setupAuth() {
    $('tabLogin').addEventListener('click', () => switchTab('login'));
    $('tabSignup').addEventListener('click', () => switchTab('signup'));
    $('authForm').addEventListener('submit', onAuthSubmit);
    $('logoutBtn').addEventListener('click', async () => {
      await sb.auth.signOut();
    });
  }

  function switchTab(m) {
    mode = m;
    const isLogin = m === 'login';
    $('tabLogin').classList.toggle('active', isLogin);
    $('tabLogin').setAttribute('aria-selected', String(isLogin));
    $('tabSignup').classList.toggle('active', !isLogin);
    $('tabSignup').setAttribute('aria-selected', String(!isLogin));
    $('authSubmit').textContent = isLogin ? 'Log in' : 'Sign up';
    $('authMsg').textContent = '';
    $('authMsg').classList.remove('success');
  }

  async function onAuthSubmit(e) {
    e.preventDefault();
    hideBanner();
    const email = $('email').value.trim();
    const password = $('password').value;
    const msg = $('authMsg');
    msg.classList.remove('success');
    if (password.length < 8) {
      msg.textContent = 'Password must be at least 8 characters.';
      return;
    }
    const btn = $('authSubmit');
    btn.disabled = true;
    btn.textContent = 'Please wait...';
    try {
      let resp;
      if (mode === 'login') {
        resp = await sb.auth.signInWithPassword({ email, password });
      } else {
        resp = await sb.auth.signUp({ email, password });
      }
      if (resp.error) {
        msg.textContent = resp.error.message;
      } else if (mode === 'signup' && resp.data && !resp.data.session) {
        msg.classList.add('success');
        msg.textContent = 'Account created. Check your email if confirmation is required.';
      }
    } catch (err) {
      msg.textContent = 'Something went wrong. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = mode === 'login' ? 'Log in' : 'Sign up';
    }
  }

  // ---- API helper ----
  async function apiCall(method, path, body) {
    const { data } = await sb.auth.getSession();
    const token = data && data.session && data.session.access_token;
    const opts = { method, headers: {} };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const resp = await fetch(path, opts);
    if (resp.status === 401) {
      showBanner('Your session has expired. Please log in again.');
      await sb.auth.signOut();
      throw new Error('unauthorized');
    }
    return resp;
  }

  // ---- GENERATOR ----
  function setupGenerator() {
    const textarea = $('notesText');
    textarea.addEventListener('input', updateCounter);

    $('lenShort').addEventListener('click', () => setLength('short'));
    $('lenMedium').addEventListener('click', () => setLength('medium'));

    $('summarizeBtn').addEventListener('click', onSummarize);
    $('copyBtn').addEventListener('click', onCopy);
  }

  function setLength(len) {
    currentLength = len;
    $('lenShort').classList.toggle('active', len === 'short');
    $('lenMedium').classList.toggle('active', len === 'medium');
  }

  function updateCounter() {
    const n = $('notesText').value.length;
    $('charCount').textContent = n + ' / 6000';
    const counter = $('charCount');
    counter.classList.toggle('too-short', n < 50);
  }

  async function onSummarize() {
    hideBanner();
    const text = $('notesText').value;
    const style = $('styleSelect').value;
    if (text.trim().length < 50) {
      showBanner('Please enter at least 50 characters of notes.');
      return;
    }
    const btn = $('summarizeBtn');
    btn.disabled = true;
    btn.textContent = 'Summarizing...';
    try {
      const resp = await apiCall('POST', '/api/summarize', { text, style, length: currentLength });
      const data = await resp.json();
      if (!resp.ok) {
        showBanner((data.error && data.error.message) || 'Could not generate summary.');
        return;
      }
      renderResult(data.note);
      $('savedNote').classList.remove('hidden');
      loadHistory();
    } catch (err) {
      if (err.message !== 'unauthorized') showBanner('Network error. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Summarize';
    }
  }

  function renderResult(note) {
    currentNote = note;
    $('resultCard').classList.remove('hidden');
    $('resultText').textContent = note.summary || '';
    $('demoBadge').classList.toggle('hidden', !note.is_demo);
    $('savedNote').classList.add('hidden');
  }

  async function onCopy() {
    if (!currentNote) return;
    try {
      await navigator.clipboard.writeText(currentNote.summary);
      $('copyBtn').textContent = 'Copied!';
      setTimeout(() => { $('copyBtn').textContent = 'Copy'; }, 1500);
    } catch (e) {
      showBanner('Could not copy to clipboard.');
    }
  }

  // ---- HISTORY ----
  function setupHistory() {}

  async function loadHistory() {
    $('historyLoading').classList.remove('hidden');
    $('historyList').classList.add('hidden');
    $('historyEmpty').classList.add('hidden');
    try {
      const resp = await apiCall('GET', '/api/notes');
      const data = await resp.json();
      if (!resp.ok) {
        showBanner((data.error && data.error.message) || 'Could not load history.');
        return;
      }
      historyCache = data.notes || [];
      renderHistory();
    } catch (err) {
      if (err.message !== 'unauthorized') showBanner('Could not load history.');
    } finally {
      $('historyLoading').classList.add('hidden');
    }
  }

  function renderHistory() {
    const list = $('historyList');
    list.innerHTML = '';
    if (historyCache.length === 0) {
      $('historyEmpty').classList.remove('hidden');
      list.classList.add('hidden');
      return;
    }
    $('historyEmpty').classList.add('hidden');
    list.classList.remove('hidden');

    const styleLabels = {
      bullets: 'Bullets',
      paragraph: 'Paragraph',
      keyterms: 'Key terms',
      exam: 'Exam',
    };

    historyCache.forEach((note) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      if (currentNote && currentNote.id === note.id) li.classList.add('active');

      const head = document.createElement('div');
      head.className = 'history-item-head';

      const title = document.createElement('p');
      title.className = 'history-title';
      title.textContent = note.title || '(untitled)';

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = 'Delete';

      head.appendChild(title);
      head.appendChild(delBtn);
      li.appendChild(head);

      const meta = document.createElement('div');
      meta.className = 'history-meta';
      const tag = document.createElement('span');
      tag.className = 'style-tag';
      tag.textContent = styleLabels[note.style] || note.style;
      const date = document.createElement('span');
      date.textContent = formatDate(note.created_at);
      meta.appendChild(tag);
      meta.appendChild(date);
      li.appendChild(meta);

      const confirmRow = document.createElement('div');
      confirmRow.className = 'confirm-row';
      const q = document.createElement('span');
      q.textContent = 'Delete this note?';
      const yes = document.createElement('button');
      yes.className = 'confirm-yes';
      yes.textContent = 'Yes, delete';
      const no = document.createElement('button');
      no.textContent = 'Cancel';
      confirmRow.appendChild(q);
      confirmRow.appendChild(yes);
      confirmRow.appendChild(no);
      li.appendChild(confirmRow);

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmRow.classList.add('show');
      });
      no.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmRow.classList.remove('show');
      });
      yes.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteNote(note.id);
      });

      li.addEventListener('click', () => {
        renderResult(note);
        document.querySelectorAll('.history-item').forEach((el) => el.classList.remove('active'));
        li.classList.add('active');
      });

      list.appendChild(li);
    });
  }

  async function deleteNote(id) {
    try {
      const resp = await apiCall('DELETE', '/api/notes/' + id);
      if (resp.status === 204) {
        historyCache = historyCache.filter((n) => n.id !== id);
        if (currentNote && currentNote.id === id) {
          currentNote = null;
          $('resultCard').classList.add('hidden');
        }
        renderHistory();
      } else if (resp.status === 404) {
        showBanner('That note no longer exists.');
        loadHistory();
      } else {
        const data = await resp.json().catch(() => ({}));
        showBanner((data.error && data.error.message) || 'Could not delete note.');
      }
    } catch (err) {
      if (err.message !== 'unauthorized') showBanner('Could not delete note.');
    }
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  init();
})();
