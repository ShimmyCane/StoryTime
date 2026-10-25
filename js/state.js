// StoryTime — app + story-in-progress state
// Other modules read App / Story and call Story.changed(part) after edits,
// which notifies whoever subscribed with Story.on(part, fn).

function newId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  // file:// pages have no randomUUID; build a v4-shaped id instead
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const App = {
  members: [],        // [{name, avatar, color, role}]
  member: null,       // current member name
  memberLevels: {},   // {name: levelId}
  level: DEFAULT_LEVEL,
  stories: [],        // library (loaded by DB.loadStories)

  levelInfo(id = this.level) {
    return LEVELS.find(l => l.id === id) || LEVELS[0];
  },

  levelIndex(id = this.level) {
    return Math.max(0, LEVELS.findIndex(l => l.id === id));
  }
};

const Story = {
  current: null,
  startedAt: null,
  _subs: {},

  fresh() {
    this.current = {
      id: newId(),
      member: App.member,
      level: App.level,
      name: '',
      createdAt: null,
      duration: 0,
      spinners: {},     // {Tone: {zh, en}, ...}
      seed: null,       // {id, zh, en, level}
      transcript: '',
      keywords: [],
      tags: [],
      decisions: []     // [{point, type, options, choice}]
    };
    this.startedAt = null;
    this.changed('all');
  },

  // Load a saved story back into the editor (re-saving updates the same id)
  load(saved) {
    this.current = JSON.parse(JSON.stringify(saved));
    delete this.current.synced;
    this.startedAt = Date.now() - (saved.duration || 0) * 1000;
    this.changed('all');
  },

  start() {
    if (!this.startedAt) this.startedAt = Date.now();
  },

  elapsedSec() {
    return this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0;
  },

  on(part, fn) {
    (this._subs[part] = this._subs[part] || []).push(fn);
  },

  changed(part) {
    const parts = part === 'all' ? Object.keys(this._subs) : [part, 'any'];
    parts.forEach(p => (this._subs[p] || []).forEach(fn => {
      try { fn(this.current); } catch (e) { _logError('Story.' + p, e.message); }
    }));
  }
};

function fmtDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
