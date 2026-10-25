// StoryTime — review + save the story in progress

const Save = {
  init() {
    document.getElementById('saveBtn').addEventListener('click', () => this.save());
    document.getElementById('storyName').addEventListener('input', e => {
      if (Story.current) Story.current.name = e.target.value;
    });
    Story.on('any', () => this.render());
    Story.on('all', () => this.render());
    setInterval(() => this.renderDuration(), 1000);
  },

  renderDuration() {
    document.getElementById('reviewDuration').textContent = fmtDuration(Story.elapsedSec());
  },

  render() {
    const s = Story.current;
    const nameInput = document.getElementById('storyName');
    if (document.activeElement !== nameInput) nameInput.value = s ? s.name : '';
    const combo = s ? Object.entries(s.spinners).map(([k, v]) =>
      `<span class="pill">${escapeHtml(k)}: ${escapeHtml(v.zh)}</span>`).join('') : '';
    document.getElementById('reviewCombo').innerHTML = combo || '<span class="muted">—</span>';
    document.getElementById('reviewTags').innerHTML = s && s.tags.length
      ? s.tags.map(t => `<span class="pill soft">#${escapeHtml(t)}</span>`).join('') : '<span class="muted">—</span>';
    document.getElementById('reviewKeywords').innerHTML = s && s.keywords.length
      ? s.keywords.map(k => `<span class="pill pick">${escapeHtml(k)}</span>`).join('') : '<span class="muted">pick in Keywords</span>';
    document.getElementById('reviewDecisions').textContent = s ? s.decisions.length : 0;
    document.getElementById('reviewWho').textContent = s && s.member
      ? `${s.member} · ${App.levelInfo(s.level).zh}` : '—';
    const t = s ? s.transcript.trim() : '';
    document.getElementById('reviewTranscript').textContent = t.length > 160 ? t.slice(0, 160) + '…' : t;
    this.renderDuration();
  },

  async save() {
    const s = Story.current;
    if (!s || !s.seed) { UI.toast('Start a story first 先开始故事'); return; }
    if (!s.member) { UI.toast('Pick who told it 先选人'); return; }
    s.duration = Story.elapsedSec();
    s.name = s.name.trim() || 'Story ' + new Date().toLocaleDateString();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    const synced = await DB.saveStory(s);
    btn.disabled = false;
    UI.toast(synced ? 'Saved ☁️ 保存好了！' : 'Saved on this iPad 📱 (will sync after sign-in)');
    UI.blip(1047, 0.15);
    App.stories = await DB.loadStories();
    Library.render();
    Dashboard.render();
  }
};
