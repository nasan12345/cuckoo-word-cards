// 库库象词源知识库 - 示例数据 (10词)
const sampleWords = [
  {
    word: 'animal',
    chinese: '动物',
    phonetic: 'ˈænəməl',
    chinese: '动物',
    category: '实义词',
    level: '小学',
    etymology: "拉丁语 animalis(有生命的) ← anima(气息、灵魂、生命) ← animus(精神、心智)。印欧语根 *ane-(吹气、呼吸)",
    tip: "anim- = 生命、气息。古罗马人认为「有呼吸的」即「有灵魂的」，animal 字面义为「有气息的生物」，与 animate(有生命的)同源",
    source: '拉丁语',
    hasImage: true
  },
  {
    word: 'apple',
    chinese: '苹果',
    phonetic: 'ˈæpəl',
    category: '实义词',
    level: '小学',
    etymology: "古英语 æppel(苹果) ← 原始日耳曼语 *ap(a)laz。印欧语根 *ab(e)l-，是通用水果名",
    tip: "日耳曼语族通用水果词。古英语中 æppel 可泛指任何圆形果实，诺曼时期后缩小到专指苹果",
    source: '古英语',
    hasImage: true
  },
  {
    word: 'astronaut',
    chinese: '宇航员',
    phonetic: 'ˈæstrəˌnɑt',
    category: '实义词',
    level: '高中',
    etymology: "现代合成词(1929)：希腊语 astron(星辰) + nautēs(水手)。astron ← astēr(星)；nautēs ← naus(船)",
    tip: "astro-(星) + naut-(航行者) →「星际航行者」。20世纪太空时代新词，参照 aeronaut(航空者)模式创造",
    source: '希腊语',
    hasImage: true
  },
  {
    word: 'afraid',
    chinese: '害怕',
    phonetic: 'əˈfreɪd',
    category: '实义词',
    level: '初中',
    etymology: "中古英语 afrayed ← 盎格鲁-法语 afrayer(使恐惧) ← 通俗拉丁语 *exfridare ← 拉丁 ex-(出) + 法兰克语 *frithu(和平)",
    tip: "词源字面义为「被赶出安宁状态」→ 受惊吓。af- 为 ex- 变体(离开)，fray 源自日耳曼语「和平」，意为「被剥夺了内心的平静」",
    source: '古法语',
    hasImage: true
  },
  {
    word: 'angry',
    chinese: '愤怒',
    phonetic: 'ˈæŋgri',
    category: '实义词',
    level: '初中',
    etymology: "中古英语 angri ← anger(痛苦、愤怒) + -y。anger ← 古诺斯语 angr(悲伤、痛苦)，印欧语根 *angh-(紧、窄)",
    tip: "anger 原指「内心被压迫的痛苦」，后转为「愤怒」。与 anxiety(焦虑)同源，都来自「紧、窄」的意象",
    source: '古诺斯语',
    hasImage: false
  },
  {
    word: 'beautiful',
    chinese: '美丽',
    phonetic: 'ˈbjutəfəl',
    category: '实义词',
    level: '高中',
    etymology: "中古英语 beaute(美丽) + -ful。beaute ← 古法语 biauté ← 拉丁语 bellus(漂亮的、可爱的)",
    tip: "beau-(美) + -ful(满是)。拉丁 bellus 源自 bonus(好)的昵称变体，字面义为「小好」→ 可爱 → 美丽",
    source: '古法语/拉丁语',
    hasImage: false
  },
  {
    word: 'bread',
    chinese: '面包',
    phonetic: 'brɛd',
    category: '实义词',
    level: '小学',
    etymology: "古英语 brēad(碎块、面包) ← 原始日耳曼语 *braudą(发酵过的食物块)。可能与 *brewwaną(酿造)同源，指「发酵的产物」",
    tip: "古英语中 hlāf 才是主要的「面包」词(→loaf)，bread 原指「碎块」。后来 bread 取代 hlāf 成为统称",
    source: '古英语',
    hasImage: true
  },
  {
    word: 'dance',
    chinese: '跳舞',
    phonetic: 'dæns',
    category: '实义词',
    level: '初中',
    etymology: "古法语 dancier(跳舞)，可能来自法兰克语 *dansōn(拉动、牵引 → 拉手跳舞)",
    tip: "可能源自日耳曼语的「拉、拽」→「手拉手围圈跳舞」。日耳曼传统中舞蹈往往是集体拉手运动",
    source: '古法语',
    hasImage: false
  },
  {
    word: 'star',
    chinese: '星',
    phonetic: 'stɑr',
    category: '实义词',
    level: '小学',
    etymology: "古英语 steorra(星星) ← 原始日耳曼语 *sterrô。印欧语根 *h₂stēr(星星)，与拉丁 stella、希腊 astēr 同源",
    tip: "印欧语核心词。首字母 s- 在拉丁中保留(stella)但在希腊中脱落(astēr)。英语保留了 s-",
    source: '古英语',
    hasImage: true
  },
  {
    word: 'school',
    chinese: '学校',
    phonetic: 'skul',
    category: '实义词',
    level: '小学',
    etymology: "古英语 scōl ← 拉丁语 schola ← 希腊语 scholē(闲暇 → 利用空闲讨论学问 → 学校)。印欧语根 *segh-(握持 → 停歇)",
    tip: "schol-(闲暇)→「有闲才能学习」→ 学校。希腊人认为从事学问的人必须从体力劳动中解放出来。同源词：scholar(学者)",
    source: '希腊语/拉丁语',
    hasImage: false
  }
];

// 完整413词小学数据加载
let allWords = [];
async function loadFullData() {
  if (allWords.length > 0) return allWords;
  try {
    const resp = await fetch('data/words_primary.json');
    allWords = await resp.json();
    // 给所有词打上 level 标记
    allWords.forEach(w => { if (!w.category) w.category = '小学'; });
    return allWords;
  } catch(e) {
    console.warn('Full data not loaded, using sample');
    return sampleWords;
  }
}
