// StoryTime — saved stories: open, delete, export JSON

const Library = {
  showAll: false,

  init() {
    document.getElementById('libraryAllToggle').addEventListener('change', e => {
      this.showAll = e.target.checked;
      this.render();
    });
    document.getElementById('exportAllBtn').addEventListener('click', () =>
      this.exportJson(this.visible(), 'storytime-library'));
  },

  visible() {
    return this.showAll || !App.member
      ? App.stories : App.stories.filter(s => s.member === App.member);
  },

  render() {
    const list = this.visible();
    const box = document.getElementById('libraryList');
    document.getElementById('libraryCount').textContent = list.length;
    if (!list.length) {
      box.innerHTML = '<p class="muted">No saved stories yet 还没有故事</p>';
      return;
    }
    box.innerHTML = list.map(s => {
      const m = App.members.find(x => x.name === s.member) || {};
      return `
        <div class="story-card" style="--chip:${escapeHtml(m.color || '#cdb4db')}">
          <div class="story-top">
            <span class="avatar">${escapeHtml(m.avatar || '⭐')}</span>
            <b>${escapeHtml(s.name)}</b>
            ${s.synced ? '' : '<span class="pill warn" title="Only on this device">📱</span>'}
          </div>
          <div class="story-meta">
            ${escapeHtml(s.member || '')} · ${escapeHtml(App.levelInfo(s.level).zh)} ·
            ${new Date(s.createdAt).toLocaleDateString()} · ${fmtDuration(s.duration || 0)}
          </div>
          <div class="story-kw">${(s.keywords || []).map(k => `<span class="pill pick">${escapeHtml(k)}</span>`).join('')}</div>
          <div class="story-actions">
            <button class="mid-btn" data-act="open" data-id="${s.id}">📖 Open</button>
            <button class="mid-btn" data-act="read" data-id="${s.id}">🔊</button>
            <button class="mid-btn" data-act="export" data-id="${s.id}">⬇︎ JSON</button>
            <button class="mid-btn danger" data-act="delete" data-id="${s.id}">🗑</button>
          </div>
        </div>`;
    }).join('');
    box.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', () =>
      this.act(btn.dataset.act, App.stories.find(s => s.id === btn.dataset.id))));
  },

  async act(act, story) {
    if (!story) return;
    if (act === 'open') {
      if (Story.current && Story.current.seed && Story.current.id !== story.id &&
          !confirm('Open this story? Unsaved changes to the current one will be lost.')) return;
      Story.load(story);
      document.getElementById('storyCard').scrollIntoView({ behavior: 'smooth' });
    }
    if (act === 'read') Narrate.speak(story.transcript);
    if (act === 'export') this.exportJson(story, 'storytime-' + story.name);
    if (act === 'delete') {
      if (!confirm(`Delete "${story.name}"? This can't be undone.`)) return;
      await DB.deleteStory(story.id);
      App.stories = App.stories.filter(s => s.id !== story.id);
      this.render();
      Dashboard.render();
    }
  },

  exportJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace(/[\\/:*?"<>|]/g, '_') + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
