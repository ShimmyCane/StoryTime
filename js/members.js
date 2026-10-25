// StoryTime — family member picker + reading level
// The level remembers per member (DB.saveMemberLevel) and can be changed per story.

const Members = {
  init() {
    document.getElementById('levelSelect').addEventListener('change', e => this.setLevel(e.target.value));
    const sel = document.getElementById('levelSelect');
    sel.innerHTML = LEVELS.map(l =>
      `<option value="${l.id}">${l.zh} · ${l.en}</option>`).join('');
  },

  render() {
    const bar = document.getElementById('memberBar');
    bar.innerHTML = App.members.map(m => `
      <button class="member-chip ${m.name === App.member ? 'active' : ''}"
              style="--chip:${escapeHtml(m.color || '#cdb4db')}" data-name="${escapeHtml(m.name)}">
        <span class="avatar">${escapeHtml(m.avatar || '⭐')}</span>${escapeHtml(m.name)}
      </button>`).join('');
    bar.querySelectorAll('.member-chip').forEach(btn =>
      btn.addEventListener('click', () => this.pick(btn.dataset.name)));
    document.getElementById('levelSelect').value = App.level;
    document.getElementById('levelHint').textContent =
      `${App.levelInfo().chars} 字 · ${App.levelInfo().sentences} 句`;
  },

  pick(name) {
    App.member = name;
    App.level = App.memberLevels[name] || DEFAULT_LEVEL;
    DB.setSetting('lastMember', name);
    if (Story.current) {
      Story.current.member = name;
      Story.current.level = App.level;
    }
    UI.blip(660);
    this.render();
    Library.render();
    Dashboard.render();
  },

  setLevel(levelId) {
    App.level = levelId;
    if (Story.current) Story.current.level = levelId;
    if (App.member) {
      App.memberLevels[App.member] = levelId;
      DB.saveMemberLevel(App.member, levelId);
    }
    Opening.applyPinyinDefault();
    this.render();
  }
};
