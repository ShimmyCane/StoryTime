// StoryTime — dials
// `en` values double as template tags (see data/templates.js), so keep them lowercase.

// The 3 starting dials (auto-spun on load)
const DEFAULT_DIALS = [
  {
    key: 'tone', zh: '心情', en: 'Tone', emoji: '🎭',
    options: [
      { zh: '开心', en: 'happy' },   { zh: '好笑', en: 'funny' },
      { zh: '勇敢', en: 'brave' },   { zh: '安静', en: 'calm' },
      { zh: '难过', en: 'sad' },     { zh: '好奇', en: 'curious' },
      { zh: '神奇', en: 'magical' }, { zh: '有点怕', en: 'scary' }
    ]
  },
  {
    key: 'setting', zh: '地方', en: 'Setting', emoji: '🗺️',
    options: [
      { zh: '森林', en: 'forest' }, { zh: '大海', en: 'ocean' },
      { zh: '城市', en: 'city' },   { zh: '太空', en: 'space' },
      { zh: '学校', en: 'school' }, { zh: '高山', en: 'mountain' },
      { zh: '农场', en: 'farm' },   { zh: '城堡', en: 'castle' },
      { zh: '家里', en: 'home' }
    ]
  },
  {
    key: 'character', zh: '主角', en: 'Character', emoji: '🐾',
    options: [
      { zh: '小龙', en: 'dragon' },   { zh: '熊猫', en: 'panda' },
      { zh: '小兔子', en: 'rabbit' }, { zh: '机器人', en: 'robot' },
      { zh: '公主', en: 'princess' }, { zh: '小猫', en: 'cat' },
      { zh: '恐龙', en: 'dinosaur' }, { zh: '小朋友', en: 'kid' },
      { zh: '小猴子', en: 'monkey' }
    ]
  }
];

// Suggestions in the Add Dial modal ("Custom" is always offered too)
const EXTRA_DIALS = [
  {
    key: 'time', zh: '时间', en: 'Time', emoji: '⏰',
    options: [
      { zh: '早上', en: 'morning' }, { zh: '晚上', en: 'night' },
      { zh: '春天', en: 'spring' },  { zh: '冬天', en: 'winter' },
      { zh: '生日', en: 'birthday' }
    ]
  },
  {
    key: 'quest', zh: '任务', en: 'Quest', emoji: '🧭',
    options: [
      { zh: '找宝贝', en: 'find treasure' }, { zh: '帮朋友', en: 'help a friend' },
      { zh: '回家', en: 'go home' },         { zh: '交朋友', en: 'make a friend' },
      { zh: '解开秘密', en: 'solve a mystery' }
    ]
  },
  {
    key: 'emotion', zh: '感觉', en: 'Emotion', emoji: '💗',
    options: [
      { zh: '孤单', en: 'lonely' }, { zh: '兴奋', en: 'excited' },
      { zh: '紧张', en: 'nervous' }, { zh: '骄傲', en: 'proud' }
    ]
  },
  {
    key: 'weather', zh: '天气', en: 'Weather', emoji: '🌦️',
    options: [
      { zh: '晴天', en: 'sunny' }, { zh: '下雨', en: 'rain' },
      { zh: '下雪', en: 'snow' },  { zh: '刮风', en: 'windy' },
      { zh: '彩虹', en: 'rainbow' }
    ]
  }
];
