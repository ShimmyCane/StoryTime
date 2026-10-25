// StoryTime — keyword extraction + tag cloud
// Words come from Intl.Segmenter (Chinese word splitting, Safari 14.1+).
// Without it: English words + Chinese 2-character pairs that repeat.
// STOP_WORDS (data/stop_words.js) are skipped; pick up to MAX_KEYWORDS (config.js).

const Keywords = {
  _debounce: null,

  init() {
    Story.on('transcript', () => {
      clearTimeout(this._debounce);
      this._debounce = setTimeout(() => this.render(), 400);
    });
    Story.on('all', () => this.render());
  },

  tokenize(text) {
    const words = [];
    if (window.Intl && Intl.Segmenter) {
      const seg = new Intl.Segmenter('zh', { granularity: 'word' });
      for (const s of seg.segment(text)) {
        if (s.isWordLike) words.push(s.segment.toLowerCase());
      }
      return words.filter(w => /[一-鿿]/.test(w) ? w.length >= 2 : w.length >= 3);
    }
    (text.toLowerCase().match(/[a-z']{3,}/g) || []).forEach(w => words.push(w));
    (text.match(/[一-鿿]+/g) || []).forEach(run => {
      for (let i = 0; i < run.length - 1; i++) words.push(run.slice(i, i + 2));
    });
    return words;
  },

  // → [[word, count], ...] most frequent first
  frequencies(text) {
    const counts = {};
    this.tokenize(text || '').forEach(w => {
      if (!STOP_WORDS.has(w)) counts[w] = (counts[w] || 0) + 1;
    });
    const hasSegmenter = window.Intl && Intl.Segmenter;
    return Object.entries(counts)
      .filter(([, n]) => hasSegmenter || n > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24);
  },

  toggle(word) {
    const k = Story.current.keywords;
    const i = k.indexOf(word);
    if (i >= 0) k.splice(i, 1);
    else if (k.length >= MAX_KEYWORDS) { UI.toast(`Pick up to ${MAX_KEYWORDS} 最多${MAX_KEYWORDS}个`); return; }
    else k.push(word);
    UI.blip(i >= 0 ? 400 : 700);
    Story.changed('keywords');
    this.render();
  },

  render() {
    const box = document.getElementById('tagCloud');
    const s = Story.current;
    if (!s || !s.transcript.trim()) {
      box.innerHTML = '<p class="muted">Tell some story first 先讲故事</p>';
      document.getElementById('keywordCount').textContent = '';
      return;
    }
    const freq = this.frequencies(s.transcript);
    // keep picked words visible even if they dropped out of the top list
    s.keywords.forEach(k => { if (!freq.find(([w]) => w === k)) freq.push([k, 1]); });
    const max = freq.length ? freq[0][1] : 1;
    box.innerHTML = freq.map(([w, n]) => {
      const size = 0.95 + (n / max) * 0.9;
      return `<button class="tag ${s.keywords.includes(w) ? 'picked' : ''}" style="font-size:${size.toFixed(2)}rem"
                data-w="${escapeHtml(w)}">${escapeHtml(w)}<sup>${n}</sup></button>`;
    }).join('') || '<p class="muted">No repeated words yet</p>';
    box.querySelectorAll('.tag').forEach(btn => btn.addEventListener('click', () => this.toggle(btn.dataset.w)));
    document.getElementById('keywordCount').textContent = `${s.keywords.length}/${MAX_KEYWORDS}`;
  }
};
