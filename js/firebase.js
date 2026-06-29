// 库库象 · Firebase Auth + Firestore
(function() {
  'use strict';

  // ========== 配置（部署前替换为你的 Firebase 项目配置）==========
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "000000000000",
    appId: "YOUR_APP_ID"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  // ========== 公开 API ==========
  window.CuckooFirebase = {
    auth,
    db,

    // 当前用户
    getCurrentUser() {
      return auth.currentUser;
    },

    // 监听认证状态
    onAuthStateChanged(callback) {
      return auth.onAuthStateChanged(callback);
    },

    // Google 登录
    signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      return auth.signInWithPopup(provider);
    },

    // 邮箱登录
    signInWithEmail(email, password) {
      return auth.signInWithEmailAndPassword(email, password);
    },

    // 邮箱注册
    signUpWithEmail(email, password) {
      return auth.createUserWithEmailAndPassword(email, password);
    },

    // 退出登录
    signOut() {
      return auth.signOut();
    },

    // ---- Firestore 学习进度 ----

    // 获取用户进度文档引用
    _getProgressRef() {
      const user = auth.currentUser;
      if (!user) return null;
      return db.collection('users').doc(user.uid).collection('progress').doc('wordProgress');
    },

    // 保存评分
    async saveScore(word, category, rating, points) {
      const ref = this._getProgressRef();
      if (!ref) return;
      const today = new Date().toISOString().slice(0, 10);

      await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const data = doc.exists ? doc.data() : {
          scores: {},       // { word: { rating, category, timestamp } }
          studyDates: [],   // ['YYYY-MM-DD']
          streak: 0,
          lastStudyDate: '',
          totalScore: 0
        };

        // 记录评分
        data.scores[word] = { rating, category, timestamp: Date.now() };

        // 学习天数
        if (!data.studyDates.includes(today)) {
          data.studyDates.push(today);
        }

        // 连续签到
        if (data.lastStudyDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          data.streak = (data.lastStudyDate === yesterday) ? data.streak + 1 : 1;
          data.lastStudyDate = today;
        }

        // 累计积分
        data.totalScore = (data.totalScore || 0) + points;

        t.set(ref, data, { merge: true });
      });
    },

    // 获取学习统计
    async getStats() {
      const ref = this._getProgressRef();
      if (!ref) return null;
      const doc = await ref.get();
      return doc.exists ? doc.data() : {
        scores: {},
        studyDates: [],
        streak: 0,
        lastStudyDate: '',
        totalScore: 0
      };
    },

    // 获取已学习单词列表（用于去重）
    async getStudiedWords() {
      const stats = await this.getStats();
      return stats ? Object.keys(stats.scores || {}) : [];
    }
  };

})();
