// StoryTime — startup: wire modules, load members + stories, auto-spin dials

const AppBoot = {
  async start() {
    UI.init();
    Members.init();
    Story.fresh();
    Opening.init();
    Narrate.init();
    Recorder.init();
    Decisions.init();
    Keywords.init();
    Save.init();
    AI.init();
    Library.init();
    Dials.init();          // auto-spins on load

    Story.on('all', () => {
      if (!(Recorder.media && Recorder.media.state === 'recording')) Recorder.reset();
    });

    // device-only data first so the page is usable immediately
    App.members = DEFAULT_MEMBERS;
    App.stories = DB._localStories();
    App.memberLevels = DB.getSetting('memberLevels', {});
    this.pickInitialMember();
    Library.render();
    Dashboard.render();

    await DB.initAuth();
    UI.renderAuth();
    await this.loadRemote();
  },

  // Called on start and after sign-in
  async loadRemote() {
    App.members = await DB.loadMembers();
    App.memberLevels = await DB.loadMemberLevels();
    App.stories = await DB.loadStories();
    this.pickInitialMember();
    Library.render();
    Dashboard.render();
  },

  pickInitialMember() {
    const last = DB.getSetting('lastMember', null);
    const name = App.members.find(m => m.name === (App.member || last)) ? (App.member || last) : null;
    App.member = name;
    App.level = (name && App.memberLevels[name]) || DEFAULT_LEVEL;
    if (Story.current) { Story.current.member = name; Story.current.level = App.level; }
    Members.render();
    Opening.applyPinyinDefault();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppBoot.start().catch(e => _logError('start', e.message));
});
