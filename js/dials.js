// StoryTime — dials: spin, tweak, add, remove
// Dial definitions live in data/dials.js (DEFAULT_DIALS, EXTRA_DIALS).

const Dials = {
  active: [],   // [{key, zh, en, emoji, options, value, removable}]

  init() {
    this.active = DEFAULT_DIALS.map(d => ({ ...d, value: null, removable: false }));
    document.getElementById('spinAllBtn').addEventListener('click', () => this.spinAll());
    document.getElementById('addDialBtn').addEventListener('click', () => this.openAddModal());
    this.render();
    this.spinAll(true);
  },

  render() {
    const box = document.getElementById('dials');
    box.innerHTML = this.active.map((d, i) => `
      <div class="dial" data-i="${i}">
        <div class="dial-head">
          <span class="dial-emoji">${d.emoji}</span>
          <span class="dial-name">${escapeHtml(d.zh)} <small>${escapeHtml(d.en)}</small></span>
          ${d.removable ? `<button class="dial-x" data-act="remove" aria-label="Remove dial">✕</button>` : ''}
        </div>
        <div class="dial-window">
          <button class="dial-arrow" data-act="prev" aria-label="Previous">◀</button>
          <div class="dial-value" data-act="spin">
            <span class="zh">${escapeHtml(d.value ? d.value.zh : '?')}</span>
            <span class="en">${escapeHtml(d.value ? d.value.en : '')}</span>
          </div>
          <button class="dial-arrow" data-act="next" aria-label="Next">▶</button>
        </div>
      </div>`).join('');

    box.querySelectorAll('.dial').forEach(el => {
      const i = Number(el.dataset.i);
      el.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'spin') this.spin(i);
        if (act === 'prev') this.step(i, -1);
        if (act === 'next') this.step(i, 1);
        if (act === 'remove') this.remove(i);
      }));
    });
  },

  _setValue(i, option) {
    this.active[i].value = option;
    const el = document.querySelector(`.dial[data-i="${i}"] .dial-value`);
    if (el) {
      el.querySelector('.zh').textContent = option.zh;
      el.querySelector('.en').textContent = option.en;
    }
  },

  // Rolls through random options, then settles (quiet = no sound, used on load)
  spin(i, quiet) {
    const d = this.active[i];
    const el = document.querySelector(`.dial[data-i="${i}"] .dial-value`);
    if (el) el.classList.add('spinning');
    let ticks = 8 + Math.floor(Math.random() * 6);
    const roll = () => {
      const opt = d.options[Math.floor(Math.random() * d.options.length)];
      this._setValue(i, opt);
      if (!quiet) UI.blip(440 + ticks * 30, 0.03);
      if (--ticks > 0) {
        setTimeout(roll, 60 + (14 - ticks) * 12);
      } else {
        if (el) el.classList.remove('spinning');
        if (!quiet) UI.blip(880, 0.08);
        this.sync();
      }
    };
    roll();
  },

  spinAll(quiet) {
    this.active.forEach((_, i) => setTimeout(() => this.spin(i, quiet), i * 120));
  },

  step(i, dir) {
    const d = this.active[i];
    const idx = d.options.findIndex(o => d.value && o.en === d.value.en);
    const next = d.options[(idx + dir + d.options.length) % d.options.length];
    this._setValue(i, next);
    UI.blip(520);
    this.sync();
  },

  remove(i) {
    this.active.splice(i, 1);
    this.render();
    this.sync();
  },

  add(def) {
    if (!def.options.length) return;
    this.active.push({ ...def, value: null, removable: true });
    this.render();
    this.spin(this.active.length - 1);
  },

  // Copies dial values into the story in progress
  sync() {
    if (!Story.current) return;
    const spinners = {};
    this.active.forEach(d => { if (d.value) spinners[d.en] = { zh: d.value.zh, en: d.value.en }; });
    Story.current.spinners = spinners;
    Story.changed('dials');
  },

  values() {
    return this.active.filter(d => d.value).map(d => d.value);
  },

  openAddModal() {
    const used = new Set(this.active.map(d => d.key));
    const choices = EXTRA_DIALS.filter(d => !used.has(d.key));
    UI.modal(`
      <h3>＋ 加一个转盘 · Add a dial</h3>
      <div class="extra-dials">
        ${choices.map(d => `
          <button class="big-btn soft" data-key="${d.key}">${d.emoji} ${d.zh} <small>${d.en}</small></button>`).join('')
          || '<p class="muted">All suggested dials are in use.</p>'}
      </div>
      <h4>Custom 自己做</h4>
      <label>Name 名字 <input id="customDialName" placeholder="e.g. 颜色 Color"></label>
      <label>Options (comma separated) 选项 <input id="customDialOptions" placeholder="红色, 蓝色, 绿色"></label>
      <button class="big-btn primary" id="customDialAdd">Add 加</button>
    `, box => {
      box.querySelectorAll('[data-key]').forEach(btn => btn.addEventListener('click', () => {
        this.add(EXTRA_DIALS.find(d => d.key === btn.dataset.key));
        UI.closeModal();
      }));
      box.querySelector('#customDialAdd').addEventListener('click', () => {
        const name = box.querySelector('#customDialName').value.trim();
        const opts = box.querySelector('#customDialOptions').value
          .split(/[,，、]/).map(s => s.trim()).filter(Boolean);
        if (!name || opts.length < 2) { UI.toast('Add a name and at least 2 options'); return; }
        this.add({
          key: 'custom_' + Date.now(), zh: name, en: name, emoji: '🎨',
          options: opts.map(o => ({ zh: o, en: o.toLowerCase() }))
        });
        UI.closeModal();
      });
    });
  }
};
