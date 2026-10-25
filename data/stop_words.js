// StoryTime — words ignored by keyword extraction (js/keywords.js)
const STOP_WORDS = new Set([
  // English
  'the', 'and', 'but', 'was', 'were', 'are', 'for', 'with', 'that', 'this', 'then',
  'they', 'them', 'there', 'their', 'she', 'her', 'his', 'him', 'you', 'your',
  'have', 'has', 'had', 'not', 'too', 'very', 'from', 'into', 'out', 'all', 'can',
  'said', 'what', 'when', 'one', 'got', 'get', 'went', 'its', 'it\'s', 'just', 'so',
  // Chinese
  '我们', '你们', '他们', '她们', '它们', '一个', '一只', '一天', '这个', '那个',
  '什么', '怎么', '然后', '可是', '但是', '因为', '所以', '就是', '还是', '没有',
  '已经', '时候', '自己', '一下', '一起', '起来', '出来', '这里', '那里', '这样',
  '那样', '如果', '还有', '我的', '你的', '他的', '她的', '它的', '很多', '一点'
]);
