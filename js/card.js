// 库库象 · 卡片交互逻辑
(function() {
  'use strict';

  // ---- 积分系统（Firebase 同步版）----
  const SCORE_MAP = { know: 10, unsure: 5, unknown: 0 };
  async function addScore(points, word, rating) {
    // 本地缓存
    const cur = parseInt(localStorage.getItem('cuckoo_study_score') || '0');
    localStorage.setItem('cuckoo_study_score', cur + points);
    
    // 云端同步（如果已登录）
    if (window.CuckooFirebase && window.CuckooFirebase.getCurrentUser()) {
      const category = sessionStorage.getItem('cuckoo_category') || '';
      try {
        await window.CuckooFirebase.saveScore(word, category, rating, points);
      } catch (e) {
        console.warn('Firebase 同步失败，使用本地缓存', e);
      }
    }
  }
  async function checkStreak() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const lastDate = localStorage.getItem('cuckoo_last_study_date');
    let streak = parseInt(localStorage.getItem('cuckoo_streak_days') || '0');

    // 记录学习日期
    let dates = [];
    try {
      dates = JSON.parse(localStorage.getItem('cuckoo_study_dates') || '[]');
    } catch(e) {}
    if (!dates.includes(todayStr)) {
      dates.push(todayStr);
      localStorage.setItem('cuckoo_study_dates', JSON.stringify(dates));
    }

    if (lastDate !== todayStr) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = (lastDate === yesterday) ? streak + 1 : 1;
      localStorage.setItem('cuckoo_streak_days', streak);
      localStorage.setItem('cuckoo_last_study_date', todayStr);
    }
    return streak;
  }

  // ---- 分类映射 ----
  const CATEGORY_MAP = {
    primary: ['小学'],
    junior: ['初中'],
    senior: ['高中'],
    challenge: ['挑战']
  };

  // ---- 状态 ----
  let cards = [];
  let currentIndex = 0;
  let stats = { know: 0, unsure: 0, unknown: 0 };
  let sessionScore = 0;
  let category = '';
  let progressKey = '';

  // ---- DOM ----
  const els = {
    card3d: document.getElementById('card3d'),
    cardImage: document.getElementById('cardImage'),
    cardWord: document.getElementById('cardWord'),
    cardChinese: document.getElementById('cardChinese'),
    cardPhonetic: document.getElementById('cardPhonetic'),
    cardSource: document.getElementById('cardSource'),
    cardEtymology: document.getElementById('cardEtymology'),
    cardTip: document.getElementById('cardTip'),
    cardAssociationImage: document.getElementById('cardAssociationImage'),
    cardWordBack: document.getElementById('cardWordBack'),
    cardChineseBack: document.getElementById('cardChineseBack'),
    cardPhoneticBack: document.getElementById('cardPhoneticBack'),
    cardSourceBack: document.getElementById('cardSourceBack'),
    cardSourceBadge: document.getElementById('cardSourceBadge'),
    cardRelated: document.getElementById('cardRelated'),
    cardCounter: document.getElementById('cardCounter'),
    progressBar: document.getElementById('progressBar'),
    flipHint: document.getElementById('flipHint'),
    ratingButtons: document.getElementById('ratingButtons'),
    nextButton: document.getElementById('nextButton'),
    completeScreen: document.getElementById('completeScreen'),
    completeStats: document.getElementById('completeStats'),
    actionArea: document.getElementById('actionArea'),
    resumeHint: document.getElementById('resumeHint')
  };

  // ---- 初始化 ----
  async function init() {
    category = sessionStorage.getItem('cuckoo_category') || '';
    sessionStorage.removeItem('cuckoo_category');

    // 读取完整数据（如果可用）
    let wordList = [...sampleWords];
    if (typeof loadFullData === 'function') {
      wordList = await loadFullData();
    }

    // 按分类过滤（使用 category 字段匹配学段）
    if (category && CATEGORY_MAP[category]) {
      const levels = CATEGORY_MAP[category];
      cards = wordList.filter(w => levels.includes(w.category));
      // 保存用户学段偏好
      localStorage.setItem('cuckoo_last_level', levels[0]);
      // 兜底：如果该分类无词，用全部
      if (cards.length === 0) cards = wordList;
    } else {
      cards = wordList;
    }

    // 学习进度持久化：按学段/分类区分，断点续学
    progressKey = 'cuckoo_learn_progress_' + (category || 'all');
    currentIndex = parseInt(localStorage.getItem(progressKey) || '0');

    // 若进度超过当前卡片总数（数据可能变更），重置到开头
    if (currentIndex >= cards.length) {
      currentIndex = 0;
      localStorage.setItem(progressKey, 0);
    }

    // 若从断点恢复，显示提示
    if (currentIndex > 0 && els.resumeHint) {
      els.resumeHint.classList.remove('hidden');
    }

    updateProgress();
    renderCard();
    bindEvents();
  }

  // ---- 渲染卡片 ----
  function renderCard() {
    if (currentIndex >= cards.length) {
      showComplete();
      return;
    }

    const w = cards[currentIndex];
    
    // 正面 — 毛毡配图（始终尝试加载，失败则回退到占位提示）
    els.cardImage.innerHTML = `<img src="assets/images/${w.word}.webp" alt="${w.word}"
      class="w-full h-full object-cover"
      onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=\\'flex flex-col items-center gap-2 w-full h-full justify-center\\'><span class=\\'text-5xl\\'>🧶</span><span class=\\'text-white/30 text-sm font-sans\\'>毛毡配图加载失败</span></div>')">`;
    els.cardWord.textContent = w.word;
    els.cardChinese.textContent = w.chinese || '';
    els.cardPhonetic.textContent = w.phonetic || '';
    els.cardSource.textContent = w.source;
    
    // 背面 - 词条信息（复刻正面）
    els.cardWordBack.textContent = w.word;
    els.cardChineseBack.textContent = w.chinese || '';
    els.cardPhoneticBack.textContent = w.phonetic || '';
    els.cardSourceBack.textContent = w.source;
    
    // 背面 - 拆分 & 联想
    els.cardEtymology.textContent = w.etymology;
    els.cardTip.textContent = w.tip;
    els.cardSourceBadge.textContent = w.source;
    
    // 联想配图 — 已移除
    els.cardAssociationImage.style.display = 'none';
    els.cardAssociationImage.innerHTML = '';
    
    // 重置翻转
    els.card3d.classList.remove('flipped');
    gsap.set(els.card3d, { rotateY: 0 });
    els.flipHint.classList.remove('hidden');
    els.ratingButtons.classList.add('hidden');
    els.nextButton.classList.add('hidden');
    
    updateProgress();
    
    gsap.fromTo(els.card3d, 
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.2)' }
    );
  }

  // ---- 翻转 ----
  let isFlipping = false;
  
  function flipCard() {
    if (isFlipping) return;
    isFlipping = true;
    
    const isFlipped = els.card3d.classList.contains('flipped');
    
    if (isFlipped) {
      els.card3d.classList.remove('flipped');
      gsap.to(els.card3d, { 
        rotateY: 0, duration: 0.6, ease: 'power2.inOut',
        onComplete: () => { isFlipping = false; }
      });
      els.flipHint.classList.remove('hidden');
      els.ratingButtons.classList.add('hidden');
    } else {
      els.card3d.classList.add('flipped');
      gsap.to(els.card3d, { 
        rotateY: 180, duration: 0.6, ease: 'power2.inOut',
        onComplete: () => { isFlipping = false; }
      });
      els.flipHint.classList.add('hidden');
      els.ratingButtons.classList.remove('hidden');
    }
  }

  // ---- 自评 ----
  function rate(level) {
    stats[level]++;
    
    // 累加积分（本地）
    const pts = SCORE_MAP[level] || 0;
    sessionScore += pts;

    // 云端记录（Firebase）
    const w = cards[currentIndex];
    const word = w ? w.word : '';
    if (word && window.CuckooFirebase && window.CuckooFirebase.getCurrentUser()) {
      const cat = sessionStorage.getItem('cuckoo_category') || '';
      window.CuckooFirebase.saveScore(word, cat, level, pts).catch(() => {});
    }
    
    // 隐藏自评，显示下一词
    els.ratingButtons.classList.add('hidden');
    els.nextButton.classList.remove('hidden');
  }

  // ---- 下一词 ----
  function nextCard() {
    currentIndex++;
    localStorage.setItem(progressKey, currentIndex);
    renderCard();
  }

  // ---- 重新开始 ----
  function restartLearning() {
    localStorage.setItem(progressKey, 0);
    currentIndex = 0;
    stats = { know: 0, unsure: 0, unknown: 0 };
    sessionScore = 0;

    // 显示卡片区域
    els.card3d.style.display = '';
    els.actionArea.style.display = '';
    els.completeScreen.classList.add('hidden');
    if (els.resumeHint) els.resumeHint.classList.add('hidden');

    updateProgress();
    renderCard();
  }

  // ---- 完成 ----
  async function showComplete() {
    els.card3d.style.display = 'none';
    els.actionArea.style.display = 'none';
    els.completeScreen.classList.remove('hidden');
    
    // 结算积分
    addScore(sessionScore);
    const totalScore = parseInt(localStorage.getItem('cuckoo_study_score') || '0');
    const streak = await checkStreak();
    
    // 尝试从云端拉取统计数据
    let cloudStats = null;
    if (window.CuckooFirebase && window.CuckooFirebase.getCurrentUser()) {
      try { cloudStats = await window.CuckooFirebase.getStats(); } catch(e) {}
    }
    
    const total = stats.know + stats.unsure + stats.unknown;
    const cloudTotal = cloudStats ? (cloudStats.totalScore || totalScore) : totalScore;
    els.completeStats.innerHTML = 
      `本轮 ${total} 词：认识 ${stats.know} · 不确定 ${stats.unsure} · 不认识 ${stats.unknown}<br>` +
      `<span class="text-cuckoo-orange">+${sessionScore} 学习积分</span> · 累计 <strong>${cloudTotal}</strong> 分<br>` +
      `<span class="text-cuckoo-blue">连续打卡 ${streak} 天</span>`;
    
    gsap.from(els.completeScreen, { opacity: 0, y: 30, duration: 0.5, ease: 'power2.out' });
  }

  // ---- 进度 ----
  function updateProgress() {
    const total = cards.length;
    const done = currentIndex;
    els.cardCounter.textContent = `${done + 1} / ${total}`;
    els.progressBar.value = done;
    els.progressBar.max = total;
  }

  // ---- 事件绑定 ----
  function bindEvents() {
    els.card3d.addEventListener('click', flipCard);
    
    document.addEventListener('keydown', function(e) {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        flipCard();
      } else if (e.key === 'ArrowRight' && !els.nextButton.classList.contains('hidden')) {
        nextCard();
      }
    });
  }

  window.rate = rate;
  window.nextCard = nextCard;
  window.restartLearning = restartLearning;

  init();
})();
