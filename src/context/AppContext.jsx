import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [starredWords, setStarredWords] = useState(() => {
    const saved = localStorage.getItem(import.meta.env.VITE_STARRED_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [learningStats, setLearningStats] = useState(() => {
    const saved = localStorage.getItem('wordvault_learning_stats');
    return saved ? JSON.parse(saved) : {
      viewedCount: 0,
      quizAccuracy: 0,
      quizCount: 0,
      viewedUnits: {}, // { 'Book Title': [unit numbers] }
      mistakes: [] // [word objects]
    };
  });

  useEffect(() => {
    localStorage.setItem(import.meta.env.VITE_STARRED_STORAGE_KEY, JSON.stringify(starredWords));
  }, [starredWords]);

  useEffect(() => {
    localStorage.setItem('wordvault_learning_stats', JSON.stringify(learningStats));
  }, [learningStats]);

  const toggleStar = (wordObj) => {
    setStarredWords(prev => {
      const isStarred = prev.find(w => w.word === wordObj.word);
      if (isStarred) {
        return prev.filter(w => w.word !== wordObj.word);
      } else {
        return [...prev, { ...wordObj, starredAt: new Date().toISOString() }];
      }
    });
  };

  const addMistake = (wordObj) => {
    setLearningStats(prev => {
      const exists = prev.mistakes.find(w => w.word === wordObj.word);
      if (exists) return prev;
      return {
        ...prev,
        mistakes: [...prev.mistakes, { ...wordObj, mistakenAt: new Date().toISOString() }]
      };
    });
  };

  const clearMistake = (word) => {
    setLearningStats(prev => ({
      ...prev,
      mistakes: prev.mistakes.filter(w => w.word !== word)
    }));
  };

  const markUnitViewed = (bookTitle, unit) => {
    setLearningStats(prev => {
      const units = prev.viewedUnits[bookTitle] || [];
      if (units.includes(unit)) return prev;
      return {
        ...prev,
        viewedUnits: {
          ...prev.viewedUnits,
          [bookTitle]: [...units, unit]
        }
      };
    });
  };

  const exportData = () => {
    const data = {
      starredWords,
      learningStats,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordvault_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.starredWords) setStarredWords(data.starredWords);
        if (data.learningStats) setLearningStats(data.learningStats);
        alert('匯入成功！');
      } catch (err) {
        alert('匯入失敗，請檢查檔案格式。');
      }
    };
    reader.readAsText(file);
  };

  const value = {
    starredWords,
    toggleStar,
    selectedBook,
    setSelectedBook,
    selectedUnit,
    setSelectedUnit,
    learningStats,
    setLearningStats,
    markUnitViewed,
    exportData,
    importData,
    addMistake,
    clearMistake
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
