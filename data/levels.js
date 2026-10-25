// StoryTime — reading levels (Kindergarten → Grade 6)
// Character counts are approximate cumulative "recognize" targets, based on the
// 2022 义务教育语文课程标准 (G1–2: ~1,600; G3–4: ~2,500; G5–6: ~3,000) and the
// 部编版 per-semester character lists. Kindergarten follows the 3-6岁儿童学习与发展指南,
// which focuses on listening and speaking rather than formal character learning.
//
// Edit freely:
//   pinyin — show pinyin over the opening by default
//   rate   — read-aloud speed (1 = normal)

const LEVELS = [
  { id: 'K',  zh: '幼儿园大班', en: 'Kindergarten',   chars: '~50, listening first', sentences: '1–2', pinyin: true,  rate: 0.65 },
  { id: '1A', zh: '一年级上',   en: 'Grade 1 fall',   chars: '~300',                 sentences: '2',   pinyin: true,  rate: 0.7  },
  { id: '1B', zh: '一年级下',   en: 'Grade 1 spring', chars: '~700',                 sentences: '2–3', pinyin: true,  rate: 0.75 },
  { id: '2A', zh: '二年级上',   en: 'Grade 2 fall',   chars: '~1,100',               sentences: '3',   pinyin: false, rate: 0.8  },
  { id: '2B', zh: '二年级下',   en: 'Grade 2 spring', chars: '~1,600',               sentences: '3–4', pinyin: false, rate: 0.85 },
  { id: '3',  zh: '三年级',     en: 'Grade 3',        chars: '~2,000',               sentences: '3–4', pinyin: false, rate: 0.9  },
  { id: '4',  zh: '四年级',     en: 'Grade 4',        chars: '~2,500',               sentences: '4',   pinyin: false, rate: 0.9  },
  { id: '5',  zh: '五年级',     en: 'Grade 5',        chars: '~2,800',               sentences: '4–5', pinyin: false, rate: 0.95 },
  { id: '6',  zh: '六年级',     en: 'Grade 6',        chars: '~3,000',               sentences: '4–5', pinyin: false, rate: 1.0  }
];

const DEFAULT_LEVEL = 'K';
