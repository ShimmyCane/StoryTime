// StoryTime — decision points (forks in the story)
// Types: 2 choices, 3 choices, or a slider between two ends.
// Each choice is logged to Story.current.decisions and noted in the transcript.

const Decisions = {
  type: 'two',

  init() {
    document.querySelectorAll('.fork-type').forEach(btn =>
      btn.addEventListener('click', () => { this.type = btn.dataset.type; this.renderForm(); }));
    document.getElementById('forkMakeBtn').addEventListener('click', () => this.make());
    Story.on('all', () => { this.clearPending(); this.renderLog(); });
    this.renderForm();
  },

  renderForm() {
    document.querySelectorAll('.fork-type').forEach(btn =>
      btn.classList.toggle('on', btn.dataset.type === this.type));
    const n = this.type === 'three' ? 3 : 2;
    const ph = this.type === 'slider'
      ? ['一点点 a little', '很多很多 a lot']
      : ['往左走 go left', '往右走 go right', '回家 go home'];
    document.getElementById('forkOptions').innerHTML = Array.from({ length: n }, (_, i) =>
      `<input class="fork-opt" placeholder="${ph[i]}">`).join('');
  },

  make() {
    if (!Story.current || !Story.current.seed) { UI.toast('Start a story first 先开始故事'); return; }
    const point = document.getElementById('forkQuestion').value.trim() || '接下来怎么办？';
    const options = [...document.querySelectorAll('.fork-opt')].map((el, i) =>
      el.value.trim() || el.placeholder.split(' ')[0] || `#${i + 1}`);
    this.showPending({ point, type: this.type, options });
  },

  showPending(fork) {
    const box = document.getElementById('forkPending');
    if (fork.type === 'slider') {
      box.innerHTML = `
        <p class="fork-q">${escapeHtml(fork.point)}</p>
        <div class="slider-row">
          <span>${escapeHtml(fork.options[0])}</span>
          <input type="range" min="0" max="100" value="50" id="forkSlider">
          <span>${escapeHtml(fork.options[1])}</span>
        </div>
        <button class="big-btn primary" id="forkSliderGo">Choose 选好了</button>`;
      box.querySelector('#forkSliderGo').addEventListener('click', () =>
        this.choose(fork, Number(box.querySelector('#forkSlider').value)));
    } else {
      box.innerHTML = `
        <p class="fork-q">${escapeHtml(fork.point)}</p>
        <div class="fork-choices">
          ${fork.options.map((o, i) => `<button class="big-btn soft" data-i="${i}">${escapeHtml(o)}</button>`).join('')}
        </div>`;
      box.querySelectorAll('[data-i]').forEach(btn =>
        btn.addEventListener('click', () => this.choose(fork, fork.options[btn.dataset.i])));
    }
  },

  clearPending() {
    document.getElementById('forkPending').innerHTML = '';
  },

  choose(fork, choice) {
    const entry = { point: fork.point, type: fork.type, options: fork.options, choice };
    Story.current.decisions.push(entry);
    const label = fork.type === 'slider'
      ? `${fork.options[0]} ←${choice}→ ${fork.options[1]}` : choice;
    Narrate.appendLine(`【${fork.point} → ${label}】`);
    Story.changed('decisions');
    this.clearPending();
    document.getElementById('forkQuestion').value = '';
    this.renderForm();
    this.renderLog();
    UI.blip(784, 0.1);
  },

  renderLog() {
    const list = Story.current ? Story.current.decisions : [];
    document.getElementById('forkLog').innerHTML = list.length
      ? list.map((d, i) => `
          <li>${escapeHtml(d.point)} → <b>${escapeHtml(d.type === 'slider' ? d.choice + '/100' : d.choice)}</b>
            <button class="mini-x" data-i="${i}" aria-label="Remove">✕</button></li>`).join('')
      : '<li class="muted">No forks yet 还没有选择</li>';
    document.querySelectorAll('#forkLog .mini-x').forEach(btn => btn.addEventListener('click', () => {
      Story.current.decisions.splice(Number(btn.dataset.i), 1);
      Story.changed('decisions');
      this.renderLog();
    }));
  }
};
