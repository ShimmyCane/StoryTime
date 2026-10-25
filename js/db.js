// StoryTime — data layer
// Stories: always written to localStorage first, then synced to Supabase when signed in.
// Members: Supabase family_members → localStorage cache → DEFAULT_MEMBERS (config.js).
// Errors go to window._storyErrors; ui.js shows them at the bottom when "Show errors" is on.

window._storyErrors = window._storyErrors || [];

function _logError(context, message) {
  const entry = { context, message, time: new Date().toLocaleTimeString() };
  window._storyErrors.push(entry);
  console.warn('[StoryTime]', context, message);
  if (typeof window._onErrorLogged === 'function') window._onErrorLogged(entry);
}

function _timeout(ms, label) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  );
}

function _readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    _logError('localStorage', `read ${key}: ${e.message}`);
    return fallback;
  }
}

function _writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    _logError('localStorage', `write ${key}: ${e.message}`);
  }
}

const DB = {
  client: null,
  user: null,

  getClient() {
    if (this.client) return this.client;
    if (!window.supabase) {
      _logError('getClient', 'Supabase SDK not loaded — check CDN script tag / internet');
      return null;
    }
    try {
      this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      _logError('getClient', 'createClient failed: ' + e.message);
    }
    return this.client;
  },

  // Runs a Supabase query with a timeout; returns data or null (and logs the error)
  async _run(label, query) {
    try {
      const { data, error } = await Promise.race([query, _timeout(SUPABASE_TIMEOUT_MS, label)]);
      if (error) { _logError(label, error.message); return null; }
      return data;
    } catch (e) {
      _logError(label, e.message);
      return null;
    }
  },

  // ---------- auth (shared family login, same as Family Habits) ----------
  async initAuth() {
    const sb = this.getClient();
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getSession();
      this.user = data.session ? data.session.user : null;
    } catch (e) {
      _logError('auth.getSession', e.message);
    }
    return this.user;
  },

  async signIn(email, password) {
    const sb = this.getClient();
    if (!sb) return { error: 'Supabase not available' };
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { _logError('signIn', error.message); return { error: error.message }; }
    this.user = data.user;
    return { user: data.user };
  },

  async signOut() {
    const sb = this.getClient();
    if (sb) await sb.auth.signOut();
    this.user = null;
  },

  // ---------- members ----------
  async loadMembers() {
    const sb = this.getClient();
    if (sb && this.user) {
      const data = await this._run('loadMembers',
        sb.from('family_members').select('name, avatar, color, role, display_order').order('display_order'));
      if (data && data.length) {
        _writeLS(LS_MEMBERS, data);
        return data;
      }
    }
    return _readLS(LS_MEMBERS, null) || DEFAULT_MEMBERS;
  },

  // Per-member default reading level → { name: levelId }
  async loadMemberLevels() {
    const local = _readLS(LS_SETTINGS, {}).memberLevels || {};
    const sb = this.getClient();
    if (!sb || !this.user) return local;
    const data = await this._run('loadMemberLevels',
      sb.from('storytime_member_settings').select('member_name, level'));
    if (!data) return local;
    const levels = { ...local };
    data.forEach(r => { levels[r.member_name] = r.level; });
    return levels;
  },

  async saveMemberLevel(name, level) {
    const settings = _readLS(LS_SETTINGS, {});
    settings.memberLevels = { ...(settings.memberLevels || {}), [name]: level };
    _writeLS(LS_SETTINGS, settings);
    const sb = this.getClient();
    if (sb && this.user) {
      await this._run('saveMemberLevel',
        sb.from('storytime_member_settings').upsert({ member_name: name, level, updated_at: new Date().toISOString() }));
    }
  },

  // ---------- settings (device-only) ----------
  getSetting(key, fallback) {
    const s = _readLS(LS_SETTINGS, {});
    return key in s ? s[key] : fallback;
  },

  setSetting(key, value) {
    const s = _readLS(LS_SETTINGS, {});
    s[key] = value;
    _writeLS(LS_SETTINGS, s);
  },

  // ---------- stories ----------
  _localStories() { return _readLS(LS_STORIES, []); },

  _storeLocal(stories) { _writeLS(LS_STORIES, stories); },

  _toRow(s) {
    return {
      id: s.id, member_name: s.member, level: s.level, name: s.name,
      created_at: s.createdAt, duration_sec: s.duration,
      spinners: s.spinners, seed: s.seed, transcript: s.transcript,
      keywords: s.keywords, tags: s.tags, decisions: s.decisions
    };
  },

  _fromRow(r) {
    return {
      id: r.id, member: r.member_name, level: r.level, name: r.name,
      createdAt: r.created_at, duration: r.duration_sec,
      spinners: r.spinners || {}, seed: r.seed || {}, transcript: r.transcript || '',
      keywords: r.keywords || [], tags: r.tags || [], decisions: r.decisions || [],
      synced: true
    };
  },

  // Remote stories + any local ones not yet synced (which get pushed now)
  async loadStories() {
    let local = this._localStories();
    const sb = this.getClient();
    if (!sb || !this.user) return local;

    const unsynced = local.filter(s => !s.synced);
    for (const s of unsynced) await this._pushStory(s);

    const data = await this._run('loadStories',
      sb.from('storytime_stories').select('*').order('created_at', { ascending: false }));
    if (!data) return this._localStories();

    const remote = data.map(r => this._fromRow(r));
    const remoteIds = new Set(remote.map(s => s.id));
    const stillLocal = this._localStories().filter(s => !s.synced && !remoteIds.has(s.id));
    const merged = [...stillLocal, ...remote];
    this._storeLocal(merged);
    return merged;
  },

  async _pushStory(story) {
    const sb = this.getClient();
    if (!sb || !this.user) return false;
    const ok = await this._run('saveStory', sb.from('storytime_stories').upsert(this._toRow(story)).select('id'));
    if (ok) {
      const stories = this._localStories().map(s => s.id === story.id ? { ...s, synced: true } : s);
      this._storeLocal(stories);
    }
    return !!ok;
  },

  // Returns true when it reached Supabase, false when saved on this device only
  async saveStory(story) {
    const stories = this._localStories().filter(s => s.id !== story.id);
    stories.unshift({ ...story, synced: false });
    this._storeLocal(stories);
    return this._pushStory(story);
  },

  async deleteStory(id) {
    this._storeLocal(this._localStories().filter(s => s.id !== id));
    const sb = this.getClient();
    if (sb && this.user) await this._run('deleteStory', sb.from('storytime_stories').delete().eq('id', id));
  }
};
