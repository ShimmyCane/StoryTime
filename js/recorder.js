// StoryTime — microphone recording + share
// Audio stays on this device (not uploaded). Share opens the iPad/iPhone share sheet
// (Messages, WhatsApp, AirDrop…); Download is the fallback where sharing files isn't supported.

const Recorder = {
  media: null,
  chunks: [],
  blob: null,
  startedAt: 0,
  timer: null,

  init() {
    document.getElementById('recBtn').addEventListener('click', () =>
      this.media && this.media.state === 'recording' ? this.stopRec() : this.startRec());
    document.getElementById('shareBtn').addEventListener('click', () => this.share());
    document.getElementById('downloadBtn').addEventListener('click', () => this.download());
    this.renderControls();
  },

  _mimeType() {
    if (!window.MediaRecorder) return '';
    return ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
      .find(t => MediaRecorder.isTypeSupported(t)) || '';
  },

  _ext() {
    return this.blob && this.blob.type.includes('mp4') ? 'm4a' : 'webm';
  },

  async startRec() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      UI.toast('Recording is not supported here');
      _logError('recorder', 'MediaRecorder unavailable (needs https or localhost)');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = this._mimeType();
      this.media = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      this.chunks = [];
      this.media.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
      this.media.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        this.blob = new Blob(this.chunks, { type: this.media.mimeType || mimeType || 'audio/webm' });
        document.getElementById('recAudio').src = URL.createObjectURL(this.blob);
        this.renderControls();
      };
      this.media.start();
      this.startedAt = Date.now();
      Story.start();
      this.timer = setInterval(() => this.renderControls(), 500);
      UI.blip(330, 0.1);
      this.renderControls();
    } catch (e) {
      UI.toast('Microphone blocked — allow it in Settings');
      _logError('recorder', e.message);
    }
  },

  stopRec() {
    clearInterval(this.timer);
    this.media.stop();
    UI.blip(220, 0.1);
  },

  renderControls() {
    const recording = this.media && this.media.state === 'recording';
    const btn = document.getElementById('recBtn');
    btn.classList.toggle('recording', !!recording);
    btn.textContent = recording ? '⏹ Stop 停' : '🎙 Record 录音';
    document.getElementById('recTime').textContent = recording
      ? fmtDuration(Math.round((Date.now() - this.startedAt) / 1000)) : '';
    const has = !!this.blob && !recording;
    ['shareBtn', 'downloadBtn', 'recAudio'].forEach(id =>
      document.getElementById(id).classList.toggle('hidden', !has));
  },

  _file() {
    const name = (Story.current && Story.current.name) || 'story';
    return new File([this.blob], `StoryTime ${name}.${this._ext()}`, { type: this.blob.type });
  },

  async share() {
    if (!this.blob) return;
    const file = this._file();
    const text = Story.current ? `${Story.current.member || ''} · ${Story.current.name}` : 'StoryTime';
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'StoryTime', text });
      } catch (e) {
        if (e.name !== 'AbortError') { _logError('share', e.message); this.download(); }
      }
    } else {
      UI.toast('Sharing files not supported here — downloading instead');
      this.download();
    }
  },

  download() {
    if (!this.blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(this.blob);
    a.download = this._file().name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // New story → forget the previous recording
  reset() {
    this.blob = null;
    document.getElementById('recAudio').removeAttribute('src');
    this.renderControls();
  }
};
