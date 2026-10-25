// StoryTime — AI helpers (Gemini, reached through the Supabase Edge Function "ai")
// Three phases: Opening (start), Forks (narrate), Critique (save).
// Every call shows its result in the status pill at the top; ⚙️ → Test AI checks the whole chain.

const AI_FN_URL = `${SUPABASE_URL}/functions/v1/ai`;
const AI_TIMEOUT_MS = 25000;

// Plain-language message for each code the function (or the network) can return
const AI_MESSAGES = {
  SIGN_IN:    'Sign in first (⚙️) to use AI',
  NO_KEY:     'No AI key saved in Supabase yet (see schema_ai.sql)',
  BAD_KEY:    'The AI key was rejected — check it in Supabase',
  QUOTA:      'AI limit reached (free quota or billing) — try again later',
  FORBIDDEN:  'AI is blocked for this key or project — check Google AI Studio',
  MODEL:      'AI model name is wrong or not available — check GEMINI_MODEL',
  BLOCKED:    'AI would not answer this text — try different words',
  BAD_OUTPUT: 'AI answered in a format the app could not read — try again',
  UPSTREAM:   'Google AI or Supabase had a problem — try again soon',
  NETWORK:    'Could not reach the AI — is the internet or Supabase down?',
  TIMEOUT:    'AI took too long — try again'
};

const AI = {
  state: 'unknown',   // unknown | ok | error
  lastError: '',
  busy: false,

  init() {
    document.getElementById('aiOpeningBtn').addEventListener('click', e =>
      this.run(e.currentTarget, () => this.opening()));
    document.getElementById('aiForksBtn').addEventListener('click', e =>
      this.run(e.currentTarget, () => this.forks()));
    document.getElementById('aiCritiqueBtn').addEventListener('click', e =>
      this.run(e.currentTarget, () => this.critique()));
    document.getElementById('aiTestBtn').addEventListener('click', e =>
      this.run(e.currentTarget, () => this.test()));
    this.renderStatus();
  },

  // Only one AI call at a time; the button being used is greyed out meanwhile
  async run(btn, fn) {
    if (this.busy) return;
    this.busy = true;
    btn.disabled = true;
    try { await fn(); } finally { this.busy = false; btn.disabled = false; }
  },

  // Sends one request to the Edge Function. Returns { ok, data } or { ok: false, code, message }.
  async call(action, payload = {}) {
    let token = SUPABASE_ANON_KEY;   // not signed in → the gateway answers 401 (SIGN_IN)
    const sb = DB.getClient();
    if (sb) {
      try {
        const { data } = await sb.auth.getSession();
        if (data.session) token = data.session.access_token;
      } catch (e) { /* fall through with the anon key */ }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    let res, body;
    try {
      res = await fetch(AI_FN_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, ...payload })
      });
      body = await res.json().catch(() => ({}));
    } catch (e) {
      return this._fail(action, e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK', e.message);
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401) return this._fail(action, 'SIGN_IN', 'gateway 401');
    if (!body.ok) return this._fail(action, body.code || 'UPSTREAM', body.message);

    this._set('ok', '');
    return { ok: true, data: body.data };
  },

  _fail(action, code, detail) {
    const msg = AI_MESSAGES[code] || AI_MESSAGES.UPSTREAM;
    _logError('AI ' + action, `${code}${detail ? ': ' + detail : ''}`);
    this._set('error', msg);
    UI.toast(msg);
    return { ok: false, code, message: msg };
  },

  _set(state, text) {
    this.state = state;
    this.lastError = text;
    this.renderStatus();
  },

  renderStatus() {
    const labels = { unknown: 'AI ?', ok: 'AI ✓', error: 'AI ✕' };
    const notes = {
      unknown: 'Not tested yet — open ⚙️ and press Test AI',
      ok: 'Last AI call worked',
      error: this.lastError
    };
    const pill = document.getElementById('aiStatus');
    pill.textContent = labels[this.state];
    pill.className = `ai-pill ${this.state}`;
    pill.title = notes[this.state];
    document.getElementById('aiTestResult').textContent =
      this.state === 'ok' ? 'Working ✓' : (this.state === 'error' ? this.lastError : 'Not tested yet');
  },

  async test() {
    const r = await this.call('ping');
    if (r.ok) UI.toast('AI works ✅');
  },

  // Phase 1 — Start: write a fresh opening from the dials (replaces the template opening)
  async opening() {
    if (!App.member) { UI.toast('Pick who is telling the story first 先选人'); return; }
    if (Story.current && Story.current.transcript.trim() && Story.current.seed &&
        !confirm('Start a new story? The current one is not saved.')) return;

    const r = await this.call('opening', {
      dials: Dials.values().map(v => `${v.en} (${v.zh})`).join(', '),
      levelName: App.levelInfo().en
    });
    if (!r.ok) return;

    Story.fresh();
    Dials.sync();
    const s = Story.current;
    s.seed = { id: 'ai', zh: r.data.zh, en: r.data.en, level: App.level };
    s.transcript = r.data.zh + '\n';
    s.tags = [];
    s.name = Dials.values().map(v => v.zh).join('·');
    s.createdAt = new Date().toISOString();
    Story.start();
    Story.changed('all');
    UI.blip(988, 0.12);
    UI.toast('New AI opening ✨');
    document.getElementById('storyCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // Phase 2 — Narrate: suggest a question and choices for the next fork (fills the Forks panel)
  async forks() {
    if (!Story.current || !Story.current.seed) { UI.toast('Start a story first 先开始故事'); return; }
    const slider = Decisions.type === 'slider';
    const r = await this.call('forks', {
      transcript: Story.current.transcript.slice(-800),
      levelName: App.levelInfo().en,
      choices: Decisions.type === 'three' ? 3 : 2,
      slider
    });
    if (!r.ok) return;

    Decisions.renderForm();
    document.getElementById('forkQuestion').value = r.data.question || '';
    const inputs = document.querySelectorAll('.fork-opt');
    inputs.forEach((el, i) => { el.value = (r.data.options || [])[i] || ''; });
    UI.toast('Suggestions added — edit, then Ask 问一问');
  },

  // Phase 3 — Save: a short, gentle critique shown in a pop-up
  async critique() {
    if (!Story.current || !Story.current.transcript.trim()) { UI.toast('Tell some of the story first'); return; }
    const r = await this.call('critique', {
      transcript: Story.current.transcript.slice(-1500),
      levelName: App.levelInfo().en
    });
    if (!r.ok) return;

    const strengths = (r.data.strengths || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
    UI.modal(`
      <h3>🤖 Story feedback 点评</h3>
      <p><b>Well done</b></p>
      <ul>${strengths}</ul>
      <p><b>Next time, try</b></p>
      <p>${escapeHtml(r.data.suggestion || '')}</p>`);
  }
};
