// StoryTime — pick an opening from STORY_TEMPLATES and seed the transcript
// Score = 2 points per dial value found in the template's tags,
//         minus 1 point per level step away from the chosen level.
// Ties are broken at random so re-spinning the same dials can give a new opening.

const Opening = {
  showPinyin: true,
  showEnglish: true,

  init() {
    document.getElementById('generateBtn').addEventListener('click', () => this.generate());
    document.getElementById('pinyinBtn').addEventListener('click', () => {
      this.showPinyin = !this.showPinyin;
      this.render();
    });
    document.getElementById('englishBtn').addEventListener('click', () => {
      this.showEnglish = !this.showEnglish;
      this.render();
    });
    document.getElementById('readOpeningBtn').addEventListener('click', () => {
      if (Story.current && Story.current.seed) Narrate.speak(Story.current.seed.zh);
    });
    this.applyPinyinDefault();
    Story.on('all', () => this.render());
  },

  applyPinyinDefault() {
    this.showPinyin = App.levelInfo().pinyin;
    this.render();
  },

  score(template, values, levelIdx) {
    const tags = new Set(template.tags);
    const hits = values.filter(v => tags.has(v.en)).length;
    const distance = Math.abs(App.levelIndex(template.level) - levelIdx);
    return { hits, score: hits * 2 - distance };
  },

  pick() {
    const values = Dials.values();
    const levelIdx = App.levelIndex();
    let best = [], bestScore = -Infinity;
    STORY_TEMPLATES.forEach(t => {
      const { score, hits } = this.score(t, values, levelIdx);
      if (score > bestScore) { best = [{ t, hits }]; bestScore = score; }
      else if (score === bestScore) best.push({ t, hits });
    });
    return best[Math.floor(Math.random() * best.length)];
  },

  generate() {
    if (!App.member) { UI.toast('Pick who is telling the story first 先选人'); return; }
    if (Story.current && Story.current.transcript.trim() && Story.current.seed &&
        !confirm('Start a new story? The current one is not saved.')) return;

    Story.fresh();
    Dials.sync();
    const { t, hits } = this.pick();
    const values = Dials.values();
    const s = Story.current;
    s.seed = { id: t.id, zh: t.zh, en: t.en, level: t.level };
    s.transcript = t.zh + '\n';
    s.tags = values.map(v => v.en).filter(v => t.tags.includes(v));
    s.name = values.map(v => v.zh).join('·');
    s.createdAt = new Date().toISOString();
    Story.start();
    Story.changed('all');
    UI.blip(988, 0.12);
    UI.toast(hits ? `Matched ${hits} dial${hits > 1 ? 's' : ''} ✨` : 'No exact match — closest opening picked');
    document.getElementById('storyCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  _pinyinHtml(text) {
    if (!this.showPinyin) return escapeHtml(text);
    if (!window.pinyinPro) {
      _logError('pinyin', 'pinyin-pro not loaded — showing characters only');
      return escapeHtml(text);
    }
    try {
      return pinyinPro.html(text);
    } catch (e) {
      _logError('pinyin', e.message);
      return escapeHtml(text);
    }
  },

  render() {
    const box = document.getElementById('opening');
    const seed = Story.current && Story.current.seed;
    document.getElementById('pinyinBtn').classList.toggle('on', this.showPinyin);
    document.getElementById('englishBtn').classList.toggle('on', this.showEnglish);
    if (!seed) {
      box.innerHTML = `<p class="muted big-hint">Spin the dials, then tap <b>✨ Start story</b>.<br>转一转，然后开始讲故事！</p>`;
      return;
    }
    const lvl = App.levelInfo(seed.level);
    box.innerHTML = `
      <div class="opening-zh ${this.showPinyin ? 'with-pinyin' : ''}">${this._pinyinHtml(seed.zh)}</div>
      ${this.showEnglish ? `<div class="opening-en">${escapeHtml(seed.en)}</div>` : ''}
      <div class="opening-meta">${escapeHtml(lvl.zh)} · ${escapeHtml(lvl.en)} · #${escapeHtml(seed.id)}</div>`;
  }
};
