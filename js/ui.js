// StoryTime — shared UI: sounds, toast, modal, gear/settings drawer, error panel

const UI = {
  _audio: null,

  // Tiny Web Audio "blip" — no sound files needed
  blip(freq = 600, dur = 0.05) {
    if (!DB.getSetting('sound', true)) return;
    try {
      this._audio = this._audio || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = this._audio, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur + 0.05);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur + 0.06);
    } catch (e) { /* sound is optional */ }
  },

  toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.remove('show'), 2600);
  },

  modal(html, wire) {
    const m = document.getElementById('modal');
    m.querySelector('.modal-body').innerHTML = html;
    m.classList.remove('hidden');
    if (wire) wire(m.querySelector('.modal-body'));
  },

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
  },

  init() {
    const modal = document.getElementById('modal');
    modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(); });
    modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());

    // gear drawer
    const gear = document.getElementById('gearBtn');
    const drawer = document.getElementById('settingsPanel');
    gear.addEventListener('click', e => { e.stopPropagation(); drawer.classList.toggle('hidden'); });
    drawer.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => drawer.classList.add('hidden'));

    // settings
    const showErr = document.getElementById('showErrorsToggle');
    showErr.checked = DB.getSetting('showErrors', false);
    showErr.addEventListener('change', () => { DB.setSetting('showErrors', showErr.checked); this.renderErrors(); });

    const sound = document.getElementById('soundToggle');
    sound.checked = DB.getSetting('sound', true);
    sound.addEventListener('change', () => DB.setSetting('sound', sound.checked));

    const rate = document.getElementById('rateSelect');
    rate.value = String(DB.getSetting('speechRate', '') || '');
    rate.addEventListener('change', () => DB.setSetting('speechRate', rate.value ? Number(rate.value) : null));

    document.getElementById('signInBtn').addEventListener('click', () => this.signIn());
    document.getElementById('signOutBtn').addEventListener('click', async () => {
      await DB.signOut();
      this.renderAuth();
      UI.toast('Signed out — stories save on this device');
    });

    window._onErrorLogged = () => this.renderErrors();
    this.renderErrors();
    this.renderAuth();
  },

  async signIn() {
    const email = document.getElementById('authEmail').value.trim();
    const pw = document.getElementById('authPassword').value;
    if (!email || !pw) { this.toast('Email and password, please'); return; }
    const { error } = await DB.signIn(email, pw);
    if (error) { this.toast('Sign-in failed: ' + error); return; }
    document.getElementById('authPassword').value = '';
    this.toast('Signed in ☁️');
    this.renderAuth();
    await AppBoot.loadRemote();
  },

  renderAuth() {
    const signedIn = !!DB.user;
    document.getElementById('authForm').classList.toggle('hidden', signedIn);
    document.getElementById('authStatus').classList.toggle('hidden', !signedIn);
    document.getElementById('authWho').textContent = signedIn ? DB.user.email : '';
    document.getElementById('cloudBadge').textContent = signedIn ? '☁️' : '📱';
    document.getElementById('cloudBadge').title = signedIn ? 'Synced to family Supabase' : 'Saving on this device only';
  },

  renderErrors() {
    const panel = document.getElementById('errorPanel');
    const on = DB.getSetting('showErrors', false);
    const errs = window._storyErrors;
    panel.classList.toggle('hidden', !on || !errs.length);
    panel.innerHTML = `<b>Errors (${errs.length})</b>` + errs.slice(-12).reverse().map(e =>
      `<div>${escapeHtml(e.time)} · <b>${escapeHtml(e.context)}</b>: ${escapeHtml(e.message)}</div>`).join('');
  }
};
