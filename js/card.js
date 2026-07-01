// 库库象 · 卡片交互逻辑
(function() {
  'use strict';

  // ---- 积分系统（纯本地版）----
  const SCORE_MAP = { know: 10, unsure: 5, unknown: 0 };
  function addScore(points) {
    const cur = parseInt(localStorage.getItem('cuckoo_study_score') || '0');
    localStorage.setItem('cuckoo_study_score', cur + points);
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
    cardFront: document.getElementById('cardFront'),
    cardImage: document.getElementById('cardImage'),
    cardWord: document.getElementById('cardWord'),
    cardChinese: document.getElementById('cardChinese'),
    cardPhonetic: document.getElementById('cardPhonetic'),
    cardSource: document.getElementById('cardSource'),
    cardEtymology: document.getElementById('cardEtymology'),
    cardTip: document.getElementById('cardTip'),
    cardSourceBadge: document.getElementById('cardSourceBadge'),
    cardCounter: document.getElementById('cardCounter'),
    progressBar: document.getElementById('progressBar'),
    ratingButtons: document.getElementById('ratingButtons'),
    nextButton: document.getElementById('nextButton'),
    completeScreen: document.getElementById('completeScreen'),
    completeStats: document.getElementById('completeStats'),
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
    
    // 词源详情
    els.cardEtymology.textContent = w.etymology;
    els.cardTip.textContent = w.tip;
    els.cardSourceBadge.textContent = w.source;
    
    // 显示自评按钮
    els.ratingButtons.classList.remove('hidden');
    els.nextButton.classList.add('hidden');
    
    updateProgress();
    
    gsap.fromTo(els.cardFront, 
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.2)' }
    );
  }

  // ---- 自评 ----
  function rate(level) {
    stats[level]++;
    
    // 累加积分（本地）
    const pts = SCORE_MAP[level] || 0;
    sessionScore += pts;

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
    els.cardFront.style.display = '';
    els.ratingButtons.style.display = '';
    els.completeScreen.classList.add('hidden');
    if (els.resumeHint) els.resumeHint.classList.add('hidden');

    updateProgress();
    renderCard();
  }

  // ---- 完成 ----
  async function showComplete() {
    els.cardFront.style.display = 'none';
    els.ratingButtons.style.display = 'none';
    els.completeScreen.classList.remove('hidden');
    
    // 结算积分
    addScore(sessionScore);
    const totalScore = parseInt(localStorage.getItem('cuckoo_study_score') || '0');
    const streak = await checkStreak();
    
    const total = stats.know + stats.unsure + stats.unknown;
    els.completeStats.innerHTML = 
      `本轮 ${total} 词：认识 ${stats.know} · 不确定 ${stats.unsure} · 不认识 ${stats.unknown}<br>` +
      `<span class="text-cuckoo-orange">+${sessionScore} 学习积分</span> · 累计 <strong>${totalScore}</strong> 分<br>` +
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
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' && !els.nextButton.classList.contains('hidden')) {
        nextCard();
      }
    });
  }

  window.rate = rate;
  window.nextCard = nextCard;
  window.restartLearning = restartLearning;

  init();
})();
