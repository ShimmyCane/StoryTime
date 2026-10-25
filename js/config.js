// StoryTime — configuration
// Family Supabase project (shared with Family Habits / Moment).
// Find these in: Supabase Dashboard > Project Settings > API

const SUPABASE_URL        = 'https://twvqvutrcobedvuhnzxq.supabase.co';
const SUPABASE_ANON_KEY   = 'sb_publishable_eqUo8HEdEB1hMQM4CpSVqA_9i6b0qCo';
const SUPABASE_TIMEOUT_MS = 5000;

// Used when Supabase is unreachable or nobody is signed in
const DEFAULT_MEMBERS = [
  { name: 'Athena', avatar: '🦄', color: '#ff6b9d', role: 'kid' },
  { name: 'Felix',  avatar: '🦊', color: '#6bd8a0', role: 'kid' },
  { name: 'Ying',   avatar: '🌸', color: '#ffd23f', role: 'parent' },
  { name: 'Jimmy',  avatar: '☕', color: '#4cc9f0', role: 'parent' }
];

// Narration helper buttons (inserted into the transcript)
const PROMPT_WORDS = [
  { zh: '然后……', en: 'and then…' },
  { zh: '突然……', en: 'suddenly…' },
  { zh: '可是……', en: 'but…' },
  { zh: '因为……', en: 'because…' },
  { zh: '它想……', en: 'it wanted…' },
  { zh: '最后……', en: 'finally…' }
];

const MAX_KEYWORDS = 4;

// localStorage keys
const LS_STORIES  = 'storytime_stories';
const LS_MEMBERS  = 'storytime_members';
const LS_SETTINGS = 'storytime_settings';
