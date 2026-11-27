'use strict';

(function () {
  const BASE = ''; // relative only

  const TESTS = [
    {
      id: 'health',
      name: 'Health endpoint',
      method: 'GET',
      path: '/api/health',
      body: null,
      expectStatus: 200,
      checks: [
        async (res) => {
          const j = await res.json().catch(() => null);
          return j && j.status === 'ok';
        },
      ],
      checkHeaders: false,
    },
    {
      id: 'valid-record',
      name: 'Valid record submission',
      method: 'POST',
      path: '/api/records',
      body: JSON.stringify({ name: 'Ada Lovelace', email: 'ada@example.com', note: 'test note' }),
      expectStatus: 200,
      checks: [
        async (res) => {
          const j = await res.json().catch(() => null);
          return !!j && j.ok === true && !!j.record;
        },
      ],
      checkHeaders: false,
    },
    {
      id: 'empty-name',
      name: 'Empty name',
      method: 'POST',
      path: '/api/records',
      body: JSON.stringify({ name: '   ', email: 'a@b.co' }),
      expectStatus: 422,
      checks: [],
      checkHeaders: false,
    },
    {
      id: 'bad-email',
      name: 'Malformed email',
      method: 'POST',
      path: '/api/records',
      body: JSON.stringify({ name: 'Bob', email: 'not-an-email' }),
      expectStatus: 422,
      checks: [],
      checkHeaders: false,
    },
    {
      id: 'markup',
      name: 'HTML markup in a field',
      method: 'POST',
      path: '/api/records',
      body: JSON.stringify({ name: '<script>x</script>', email: 'a@b.co' }),
      expectStatus: 422,
      checks: [],
      checkHeaders: false,
    },
    {
      id: 'object-name',
      name: 'Unexpected object input',
      method: 'POST',
      path: '/api/records',
      body: JSON.stringify({ name: { x: 1 }, email: 'a@b.co' }),
      expectStatus: 422,
      checks: [],
      checkHeaders: false,
    },
    {
      id: 'unknown-route',
      name: 'Unknown route',
      method: 'GET',
      path: '/api/nope',
      body: null,
      expectStatus: 404,
      checks: [],
      checkHeaders: false,
    },
    {
      id: 'security-headers',
      name: 'Security headers',
      method: 'GET',
      path: '/api/health',
      body: null,
      expectStatus: 200,
      checks: [],
      checkHeaders: true,
    },
    {
      id: 'query-regression',
      name: 'URL query regression',
      method: 'GET',
      path: '/api/health?x=1',
      body: null,
      expectStatus: 200,
      checks: [
        async (res) => {
          const j = await res.json().catch(() => null);
          return !!j && j.status === 'ok';
        },
      ],
      checkHeaders: false,
      extraPath: '/api/health?next=/api/records',
    },
  ];

  const REQUIRED_HEADERS = [
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'content-security-policy',
    'cross-origin-resource-policy',
  ];
  const REQUIRED_HEADER_VALUES = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'deny',
    'referrer-policy': 'no-referrer',
    'cross-origin-resource-policy': 'same-origin',
  };

  const state = {
    results: [],
    trace: [],
    timing: null,
  };

  function nowStamp() {
    const d = new Date();
    return d.toISOString();
  }

  function appendTrace(text, cls) {
    const span = document.createElement('span');
    span.className = cls || '';
    span.textContent = text;
    const line = document.createElement('div');
    const timeSpan = document.createElement('span');
    timeSpan.className = 't-time';
    timeSpan.textContent = '[' + nowStamp() + '] ';
    line.appendChild(timeSpan);
    line.appendChild(span);
    const traceEl = document.getElementById('trace');
    traceEl.appendChild(line);
    traceEl.scrollTop = traceEl.scrollHeight;
    state.trace.push({ ts: nowStamp(), text, cls: cls || '' });
  }

  function isRelativePath(p) {
    if (typeof p !== 'string') return false;
    if (p.includes('://')) return false;
    if (p.startsWith('//')) return false;
    return p.startsWith('/');
  }

  async function runOne(test) {
    if (!isRelativePath(test.path)) {
      return { result: 'ERROR', status: null, ms: 0, headersOk: null, error: 'Refused non-relative URL' };
    }
    const t0 = performance.now();
    let res;
    try {
      const opts = { method: test.method };
      if (test.body !== null && test.body !== undefined) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = test.body;
      }
      appendTrace('REQ ' + test.method + ' ' + test.path + (test.body ? ' body=' + test.body : ''), 't-req');
      res = await fetch(test.path, opts);
    } catch (e) {
      const ms = performance.now() - t0;
      appendTrace('ERR ' + (e && e.message ? e.message : 'fetch failed'), 't-err');
      return { result: 'ERROR', status: null, ms, headersOk: null, error: String(e && e.message ? e.message : 'fetch failed') };
    }
    const ms = performance.now() - t0;

    // If extraPath (query regression), also fetch it
    let extraOk = true;
    if (test.extraPath) {
      if (!isRelativePath(test.extraPath)) {
        extraOk = false;
      } else {
        try {
          const r2 = await fetch(test.extraPath, { method: 'GET' });
          appendTrace('REQ GET ' + test.extraPath, 't-req');
          appendTrace('RES ' + r2.status + ' ' + (r2.headers.get('content-type') || '') + ' ' + ms.toFixed(1) + 'ms', 't-res');
          if (r2.status !== 200) extraOk = false;
        } catch (e) {
          extraOk = false;
        }
      }
    }

    const actualStatus = res.status;
    appendTrace('RES ' + actualStatus + ' ' + (res.headers.get('content-type') || '') + ' ' + ms.toFixed(1) + 'ms', 't-res');

    // Header checks
    let headersOk = null;
    let headerDetails = [];
    if (test.checkHeaders) {
      headersOk = true;
      for (const h of REQUIRED_HEADERS) {
        const v = res.headers.get(h);
        if (v === null) {
          headersOk = false;
          headerDetails.push(h + ': missing');
        } else {
          const expected = REQUIRED_HEADER_VALUES[h];
          if (expected && v.toLowerCase() !== expected) {
            headersOk = false;
            headerDetails.push(h + '=' + v);
          }
        }
      }
      // CSP must contain the required directives
      const csp = res.headers.get('content-security-policy') || '';
      const requiredCsp = ["default-src 'self'", "script-src 'self'", "style-src 'self'", "connect-src 'self'", "frame-ancestors 'none'"];
      for (const d of requiredCsp) {
        if (!csp.includes(d)) {
          headersOk = false;
          headerDetails.push('CSP missing: ' + d);
        }
      }
      // Cache-Control on API responses
      const cc = res.headers.get('cache-control');
      if (cc !== 'no-store') {
        headersOk = false;
        headerDetails.push('cache-control=' + (cc || 'missing'));
      }
    }

    // Body checks
    let checksOk = true;
    if (test.checks && test.checks.length) {
      for (const chk of test.checks) {
        try {
          const ok = await chk(res.clone());
          if (!ok) checksOk = false;
        } catch (e) {
          checksOk = false;
        }
      }
    }
    if (test.extraPath && !extraOk) checksOk = false;

    const statusOk = actualStatus === test.expectStatus;
    const passed = statusOk && checksOk && (test.checkHeaders ? headersOk === true : true);
    return {
      result: passed ? 'PASS' : 'FAIL',
      status: actualStatus,
      ms,
      headersOk,
      headerDetails,
      statusOk,
      checksOk,
    };
  }

  function renderMatrix() {
    const tbody = document.getElementById('matrix-body');
    tbody.replaceChildren();
    let pass = 0, fail = 0, err = 0;
    for (let i = 0; i < state.results.length; i++) {
      const t = TESTS[i];
      const r = state.results[i];
      if (!r) continue;
      if (r.result === 'PASS') pass++;
      else if (r.result === 'FAIL') fail++;
      else err++;

      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.textContent = t.name;
      tr.appendChild(tdName);

      const tdReq = document.createElement('td');
      tdReq.className = 'req';
      tdReq.textContent = t.method + ' ' + t.path;
      tr.appendChild(tdReq);

      const tdExp = document.createElement('td');
      tdExp.className = 'mono';
      tdExp.textContent = String(t.expectStatus);
      tr.appendChild(tdExp);

      const tdAct = document.createElement('td');
      tdAct.className = 'mono';
      tdAct.textContent = r.status === null || r.status === undefined ? '—' : String(r.status);
      tr.appendChild(tdAct);

      const tdH = document.createElement('td');
      if (t.checkHeaders) {
        tdH.className = r.headersOk ? 'headers-ok' : 'headers-bad';
        tdH.textContent = r.headersOk ? 'OK' : 'BAD';
        if (r.headerDetails && r.headerDetails.length) {
          tdH.title = r.headerDetails.join('\n');
        }
      } else {
        tdH.className = 'mono';
        tdH.textContent = '—';
      }
      tr.appendChild(tdH);

      const tdTime = document.createElement('td');
      tdTime.className = 'mono';
      tdTime.textContent = r.ms ? r.ms.toFixed(1) : '—';
      tr.appendChild(tdTime);

      const tdRes = document.createElement('td');
      tdRes.className = 'result-' + r.result.toLowerCase();
      tdRes.textContent = r.result;
      tr.appendChild(tdRes);

      const tdRun = document.createElement('td');
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Run';
      btn.addEventListener('click', () => runSingle(i));
      tdRun.appendChild(btn);
      tr.appendChild(tdRun);

      tbody.appendChild(tr);
    }
    document.querySelector('.sum-pass').textContent = 'Passed ' + pass;
    document.querySelector('.sum-fail').textContent = 'Failed ' + fail;
    document.querySelector('.sum-err').textContent = 'Errors ' + err;
    document.querySelector('.sum-total').textContent = 'Total ' + state.results.length;
  }

  async function runSingle(i) {
    const test = TESTS[i];
    state.results[i] = await runOne(test);
    renderMatrix();
  }

  async function runAll() {
    const btn = document.getElementById('run-all');
    btn.disabled = true;
    state.results = new Array(TESTS.length).fill(null);
    renderMatrix();
    for (let i = 0; i < TESTS.length; i++) {
      state.results[i] = await runOne(TESTS[i]);
      renderMatrix();
    }
    btn.disabled = false;
  }

  // Timing
  async function runTiming() {
    const el = document.getElementById('timing-results');
    el.replaceChildren();
    const btn = document.getElementById('run-timing');
    btn.disabled = true;
    const times = [];
    for (let i = 0; i < 20; i++) {
      const t0 = performance.now();
      try {
        const res = await fetch('/api/health', { method: 'GET' });
        await res.text();
        times.push(performance.now() - t0);
      } catch (e) {
        times.push(performance.now() - t0);
      }
    }
    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const median = times[Math.floor(times.length / 2)];
    const p95Idx = Math.min(times.length - 1, Math.floor(0.95 * times.length));
    const p95 = times[p95Idx];
    const summary = { min, median, max, p95, count: times.length };
    state.timing = summary;

    const cards = [
      ['min', min],
      ['median', median],
      ['max', max],
      ['p95', p95],
    ];
    for (const [label, val] of cards) {
      const card = document.createElement('div');
      card.className = 'timing-card';
      const l = document.createElement('div');
      l.className = 'label';
      l.textContent = label + ' (Measured)';
      const v = document.createElement('div');
      v.className = 'value';
      v.textContent = val.toFixed(2) + ' ms';
      card.appendChild(l);
      card.appendChild(v);
      el.appendChild(card);
    }

    const proposed = document.getElementById('proposed-list');
    proposed.replaceChildren();
    const proposals = [
      'Enable HTTP compression (gzip/br) for large text responses.',
      'Set Cache-Control on immutable static assets where appropriate.',
      'Keep API responses with Cache-Control: no-store (already applied).',
      'Consider connection keep-alive tuning for high-throughput scenarios.',
    ];
    for (const p of proposals) {
      const li = document.createElement('li');
      li.textContent = p;
      proposed.appendChild(li);
    }
    btn.disabled = false;
  }

  // Export
  function exportAudit() {
    const audit = {
      timestamp: new Date().toISOString(),
      baseUrl: location.origin,
      tests: TESTS.map((t, i) => {
        const r = state.results[i] || {};
        return {
          name: t.name,
          request: { method: t.method, path: t.path, body: t.body || null },
          expected: { status: t.expectStatus, checkHeaders: !!t.checkHeaders },
          actual: {
            status: r.status === undefined ? null : r.status,
            result: r.result || 'NOT_RUN',
            responseTimeMs: r.ms || null,
            headersOk: r.headersOk === undefined ? null : r.headersOk,
            headerDetails: r.headerDetails || [],
          },
          timing: r.ms || null,
        };
      }),
      timingSummary: state.timing || null,
      diagnosticTrace: state.trace.map((x) => ({ ts: x.ts, text: x.text })),
      limitations:
        'Vigil tests only this local application. Basic validation and header checks are not a comprehensive production security audit.',
    };
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vigil-audit.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Trace clear
  function clearTrace() {
    state.trace = [];
    document.getElementById('trace').replaceChildren();
  }

  // Loader
  function hideLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      loader.classList.add('hidden');
    } else {
      loader.classList.add('hidden');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('run-all').addEventListener('click', runAll);
    document.getElementById('run-timing').addEventListener('click', runTiming);
    document.getElementById('clear-trace').addEventListener('click', clearTrace);
    document.getElementById('export-audit').addEventListener('click', exportAudit);

    renderMatrix();

    setTimeout(hideLoader, 1500);
  });
})();
