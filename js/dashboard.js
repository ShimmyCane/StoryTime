// StoryTime — cross-story keyword totals + next-focus hints
// Uses the same member filter as the Library ("All family" toggle).

const Dashboard = {
  render() {
    const stories = Library.visible();
    const box = document.getElementById('dashboard');
    if (!stories.length) {
      box.innerHTML = '<p class="muted">Save a story to see totals 保存故事后可以看到统计</p>';
      return;
    }

    // keyword totals (picked keywords across stories)
    const kw = {};
    stories.forEach(s => (s.keywords || []).forEach(k => { kw[k] = (kw[k] || 0) + 1; }));
    const top = Object.entries(kw).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const max = top.length ? top[0][1] : 1;

    const totalSec = stories.reduce((n, s) => n + (s.duration || 0), 0);
    const forks = stories.reduce((n, s) => n + (s.decisions || []).length, 0);

    box.innerHTML = `
      <div class="stat-row">
        <div class="stat"><b>${stories.length}</b><span>stories 故事</span></div>
        <div class="stat"><b>${fmtDuration(totalSec)}</b><span>told 讲了</span></div>
        <div class="stat"><b>${forks}</b><span>forks 选择</span></div>
      </div>
      <h4>Top keywords 常用词</h4>
      ${top.length ? top.map(([w, n]) => `
        <div class="bar-row"><span class="bar-label">${escapeHtml(w)}</span>
          <span class="bar"><span style="width:${(n / max) * 100}%"></span></span><span class="bar-n">${n}</span></div>`).join('')
        : '<p class="muted">No keywords picked yet</p>'}
      <h4>Next time try 下次试试</h4>
      <ul class="hints">${this.hints(stories).map(h => `<li>${h}</li>`).join('')}</ul>`;
  },

  // Least-used option on each default dial, plus a nudge toward forks/keywords
  hints(stories) {
    const hints = [];
    DEFAULT_DIALS.forEach(d => {
      const used = {};
      d.options.forEach(o => { used[o.en] = 0; });
      stories.forEach(s => {
        const v = s.spinners && s.spinners[d.en];
        if (v && v.en in used) used[v.en]++;
      });
      const least = Object.entries(used).sort((a, b) => a[1] - b[1])[0];
      const opt = d.options.find(o => o.en === least[0]);
      hints.push(`${d.emoji} ${escapeHtml(d.zh)}: <b>${escapeHtml(opt.zh)}</b> (${escapeHtml(opt.en)}) — used ${least[1]}×`);
    });
    const noForks = stories.filter(s => !(s.decisions || []).length).length;
    if (noForks > stories.length / 2) hints.push('🔀 Add a fork 加一个选择 to the next story');
    const avg = stories.reduce((n, s) => n + (s.duration || 0), 0) / stories.length;
    if (avg < 180) hints.push('⏱ Try a longer story — over 3 minutes 讲长一点');
    return hints;
  }
};
