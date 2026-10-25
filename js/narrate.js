// StoryTime — narration: prompt buttons, transcript, zh-CN read-aloud
// Tip for kids: the iPad keyboard's 🎤 dictation button types spoken Chinese into the transcript.

const Narrate = {
  init() {
    const ta = document.getElementById('transcript');
    ta.addEventListener('input', () => {
      if (!Story.current) return;
      Story.current.transcript = ta.value;
      Story.start();
      Story.changed('transcript');
    });

    document.getElementById('prompts').innerHTML = PROMPT_WORDS.map((p, i) =>
      `<button class="prompt-btn" data-i="${i}">${escapeHtml(p.zh)}<small>${escapeHtml(p.en)}</small></button>`).join('');
    document.querySelectorAll('.prompt-btn').forEach(btn =>
      btn.addEventListener('click', () => this.insert(PROMPT_WORDS[btn.dataset.i].zh)));

    document.getElementById('readStoryBtn').addEventListener('click', () => {
      const sel = ta.value.substring(ta.selectionStart, ta.selectionEnd);
      this.speak(sel || ta.value);
    });
    document.getElementById('stopReadBtn').addEventListener('click', () => this.stop());

    Story.on('all', s => { ta.value = s ? s.transcript : ''; });
    setInterval(() => {
      document.getElementById('storyClock').textContent = '⏱ ' + fmtDuration(Story.elapsedSec());
    }, 1000);
  },

  // Inserts text at the cursor (or end) of the transcript
  insert(text) {
    const ta = document.getElementById('transcript');
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.dispatchEvent(new Event('input'));
    UI.blip(600);
  },

  appendLine(text) {
    if (!Story.current) return;
    const t = Story.current.transcript;
    Story.current.transcript = (t && !t.endsWith('\n') ? t + '\n' : t) + text + '\n';
    document.getElementById('transcript').value = Story.current.transcript;
    Story.changed('transcript');
  },

  _voice() {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => v.lang === 'zh-CN') ||
           voices.find(v => v.lang && v.lang.toLowerCase().startsWith('zh')) || null;
  },

  speak(text) {
    if (!('speechSynthesis' in window)) { UI.toast('Read-aloud is not supported in this browser'); return; }
    if (!text || !text.trim()) return;
    this.stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = DB.getSetting('speechRate', null) || App.levelInfo().rate;
    const v = this._voice();
    if (v) u.voice = v;
    else _logError('speech', 'No Chinese voice found — iPad: Settings > Accessibility > Spoken Content > Voices');
    u.onerror = e => _logError('speech', e.error || 'speech failed');
    speechSynthesis.speak(u);
  },

  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
};
