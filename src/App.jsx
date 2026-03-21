import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from './context/AppContext';
import BookSelection from './components/BookSelection';
import WordCard from './components/WordCard';
import QuizEngine from './components/QuizEngine';
import { useVocabulary } from './hooks/useVocabulary';

const App = () => {
  const {
    selectedBook, setSelectedBook,
    selectedUnit, setSelectedUnit,
    starredWords, toggleStar, learningStats, setLearningStats,
    markUnitViewed, clearMistake
  } = useApp();
  const { words, setWords, loading, setLoading, fetchWords } = useVocabulary();
  const [view, setView] = useState('home'); // home, list, quiz, starred, stats
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, starred
  const [quizSelection, setQuizSelection] = useState([]); // Array of unit numbers
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const cardSliderRef = useRef(null);
  const isScrollingRef = useRef(false);

  const handleUnitSelect = (unit) => {
    if (view === 'quiz_setup') {
      setQuizSelection(prev => {
        if (prev.includes(unit)) return prev.filter(u => u !== unit);
        if (prev.length >= 5) {
          alert('最多選擇 5 個單元進行跨區測驗');
          return prev;
        }
        return [...prev, unit].sort((a, b) => a - b);
      });
      return;
    }
    setSelectedUnit(unit);
    fetchWords(selectedBook.title, unit);
    setView('list');
    setSearchQuery('');
    setFilterType('all');
    setSelectedWordIndex(0);
    if (cardSliderRef.current) cardSliderRef.current.scrollLeft = 0;
  };

  const quizWords = useMemo(() => {
    if (view !== 'quiz' && view !== 'quiz_review') return [];

    const sourceWords = view === 'quiz_review' ? learningStats.mistakes : words;
    const flattened = [];
    sourceWords.forEach(w => {
      flattened.push(w);
      if (w.derivatives && Array.isArray(w.derivatives)) {
        flattened.push(...w.derivatives);
      }
    });
    return flattened;
  }, [words, view]); // Only re-cap words when the unit words or view mode changes

  const handleStartRangeQuiz = async () => {
    if (quizSelection.length === 0) return;

    // Fetch all words for selected units
    const allWords = [];
    setView('loading');
    setLoading(true); // Set loading state for vocabulary hook
    for (const unit of quizSelection) {
      const resp = await fetch(`${import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL}?book=${encodeURIComponent(selectedBook.title)}&unit=${unit}`);
      const data = await resp.json();
      const unitWords = Array.isArray(data) ? data : (data.data || []);
      allWords.push(...unitWords);
    }
    setLoading(false); // Reset loading state

    if (allWords.length === 0) {
      alert('所選單元暫無資料');
      setView('home');
      return;
    }

    // Pass these words to QuizEngine
    // We'll use a temporary state or reuse words
    // For now, let's just use the words state but note it's multiple
    setWords(allWords);
    setView('quiz');
  };

  const filteredWords = (Array.isArray(words) ? words : []).filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.meaning.includes(searchQuery);
    const isStarred = starredWords.some(w => w.word === word.word);
    const matchesFilter = filterType === 'all' || (filterType === 'starred' && isStarred);
    return matchesFilter && matchesSearch;
  });

  const handleQuizComplete = (score, total) => {
    setLearningStats(prev => ({
      ...prev,
      quizCount: prev.quizCount + 1,
      quizAccuracy: Math.round(((prev.quizAccuracy * prev.quizCount) + (score / total * 100)) / (prev.quizCount + 1))
    }));
    setView('list');
  };

  const speak = (text) => {
    window.speechSynthesis.cancel();
    
    // Warm up the engine with a tiny silent space to pre-allocate audio buffer
    const warmUp = new SpeechSynthesisUtterance(" ");
    warmUp.volume = 0;
    window.speechSynthesis.speak(warmUp);

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      
      // Try to find a high-quality voice
      const voices = window.speechSynthesis.getVoices();
      const bestVoice = voices.find(v => v.name.includes('Google US English')) || 
                      voices.find(v => v.lang.startsWith('en-US')) || 
                      voices.find(v => v.lang.startsWith('en'));
      if (bestVoice) utterance.voice = bestVoice;
      
      utterance.rate = 0.85;
      window._latestUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }, 150); 
  };

  useEffect(() => {
    if (!cardSliderRef.current || view !== 'list') return;

    const slider = cardSliderRef.current;
    const observerOptions = {
      root: slider,
      threshold: 0.6 // Trigger when 60% of card is visible
    };

    const observer = new IntersectionObserver((entries) => {
      if (isScrollingRef.current) return; // Ignore updates during programmatic scroll

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index'));
          setSelectedWordIndex(prev => (prev === index ? prev : index));
        }
      });
    }, observerOptions);

    const items = slider.querySelectorAll('.slider-item');
    items.forEach(item => observer.observe(item));

    return () => observer.disconnect();
  }, [words, view]); // Simplified dependencies

  useEffect(() => {
    if (!cardSliderRef.current) return;
    const slider = cardSliderRef.current;
    const items = slider.querySelectorAll('.slider-item');
    const target = items[selectedWordIndex];
    if (!target) return;

    // Check if we actually need to scroll
    if (Math.abs(slider.scrollLeft - target.offsetLeft) < 5) return;

    isScrollingRef.current = true;
    slider.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });

    const t = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000); // 1000ms to ensure smooth scroll and bouncing finishes
    return () => clearTimeout(t);
  }, [selectedWordIndex]);

  const renderContent = () => {
    if (view === 'starred') {
      const starredResults = starredWords.filter(w =>
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.meaning.includes(searchQuery)
      );

      return (
        <div className="fade-in">
          <header className="section-header">
            <div className="flex-group">
              <button className="btn btn-secondary" onClick={() => setView('home')}>← 返回</button>
              <h2 className="gradient-text">星號單字 ({starredWords.length})</h2>
            </div>
            <div className="search-bar glass">
              <input
                type="text"
                placeholder="搜尋星號單字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>
          <div className="word-grid grid-mode">
            {starredResults.length > 0 ? (
              starredResults.map(word => <WordCard key={word.word} wordData={word} />)
            ) : (
              <p className="empty-msg">找不到符合的星號單字</p>
            )}
          </div>
        </div>
      );
    }

    if (view === 'review') {
      return (
        <div className="fade-in">
          <header className="section-header">
            <h2 className="gradient-text">複習專區</h2>
            <div className="nav-actions">
              {learningStats.mistakes.length > 0 && (
                <button className="btn btn-primary" onClick={() => setView('quiz_review')}>開始複習測驗</button>
              )}
            </div>
          </header>

          <div className="review-intro glass">
            <p>這裡記錄了你在測驗中答錯的單字。你可以點擊星號將其加入收藏，或完全熟記後從此清單移除。</p>
          </div>

          <div className="word-grid grid-mode">
            {learningStats.mistakes.length > 0 ? (
              learningStats.mistakes.map(word => (
                <div key={word.word} className="review-item-container">
                  <WordCard wordData={word} />
                  <button className="btn-remove-mistake" onClick={() => clearMistake(word.word)}>已熟記，從複習清單移除</button>
                </div>
              ))
            ) : (
              <p className="empty-msg">目前沒有錯誤單字，太棒了！</p>
            )}
          </div>
        </div>
      );
    }

    if (view === 'quiz' || view === 'quiz_review') {
      return (
        <QuizEngine
          words={quizWords}
          onComplete={handleQuizComplete}
          onCancel={() => setView(view === 'quiz_review' ? 'review' : 'list')}
        />
      );
    }

    if (view === 'stats') {
      const { exportData, importData } = useApp();
      return (
        <div className="container fade-in">
          <header className="section-header">
            <h2 className="gradient-text">學習統計與備份</h2>
            <div className="nav-actions">
              <button className="btn btn-secondary" onClick={exportData}>匯出備份 (JSON)</button>
              <label className="btn btn-primary cursor-pointer">
                匯入備份
                <input type="file" hidden onChange={(e) => importData(e.target.files[0])} />
              </label>
            </div>
          </header>
          <div className="stats-grid">
            <div className="stat-card glass">
              <h4>總紀錄單字</h4>
              <p className="stat-val">{starredWords.length}</p>
              <span className="stat-label">星號標註</span>
            </div>
            <div className="stat-card glass">
              <h4>錯誤紀錄</h4>
              <p className="stat-val">{learningStats.mistakes.length}</p>
              <span className="stat-label">待複習單字</span>
            </div>
            <div className="stat-card glass">
              <h4>完成測驗數</h4>
              <p className="stat-val">{learningStats.quizCount}</p>
              <span className="stat-label">累積練習</span>
            </div>
          </div>
        </div>
      );
    }

    if (!selectedBook) {
      return <BookSelection />;
    }

    if (!selectedUnit) {
      const viewedUnits = learningStats.viewedUnits[selectedBook.title] || [];
      const isQuizSetup = view === 'quiz_setup';

      return (
        <div className="fade-in">
          <header className="section-header">
            <div className="flex-group">
              <button className="btn btn-secondary" onClick={() => { setSelectedBook(null); setView('home'); setQuizSelection([]); }}>← 返回</button>
              <h2 className="gradient-text">{selectedBook.title}</h2>
            </div>
            <div className="flex-group">
              {isQuizSetup ? (
                <>
                  <span className="selection-count">已選 {quizSelection.length} 單元</span>
                  <button className="btn btn-primary" onClick={handleStartRangeQuiz} disabled={quizSelection.length === 0}>開始練習</button>
                  <button className="btn btn-secondary" onClick={() => { setView('home'); setQuizSelection([]); }}>取消</button>
                </>
              ) : (
                <button className="btn btn-secondary" onClick={() => setView('quiz_setup')}>📍 範圍測驗</button>
              )}
            </div>
          </header>

          {isQuizSetup && (
            <div className="setup-hint glass">
              請選擇 1~5 個單元進行跨區綜合測驗
            </div>
          )}

          <div className="unit-grid">
            {Array.from({ length: 40 }, (_, i) => i + 1).map(unit => (
              <button
                key={unit}
                className={`unit-btn glass ${quizSelection.includes(unit) ? 'selected' : ''}`}
                onClick={() => handleUnitSelect(unit)}
              >
                Unit {unit}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="container fade-in">
        <header className="section-header">
          <div className="flex-group">
            <button className="btn btn-secondary" onClick={() => setSelectedUnit(null)}>← 返回</button>
            <h2 className="gradient-text">Unit {selectedUnit}</h2>
          </div>
          <div className="filter-actions flex-group">
            <div className="search-bar glass">
              <input
                type="text"
                placeholder="搜尋單字..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedWordIndex(0);
                }}
              />
            </div>
            <select
              className="filter-select glass"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setSelectedWordIndex(0);
              }}
            >
              <option value="all">全部單字</option>
              <option value="starred">星號單字</option>
            </select>
            <button className="btn btn-primary" onClick={() => setView('quiz')}>開始測驗</button>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">載入中...</div>
        ) : (
          <div className="vocabulary-view">
            {(() => {
              // Flatten words and derivatives for the list
              const flattened = [];
              filteredWords.forEach(mainWord => {
                flattened.push({ ...mainWord, isMain: true });
                if (mainWord.derivatives && Array.isArray(mainWord.derivatives)) {
                  mainWord.derivatives.forEach(der => {
                    flattened.push({ ...der, isDerivative: true, parentWord: mainWord.word });
                  });
                }
              });

              return (
                <>
                  {flattened.length > 0 && (
                    <div className="slider-wrapper">
                      <div
                        className="card-slider"
                        ref={cardSliderRef}
                      >
                        {flattened.map((word, idx) => (
                          <div
                            key={word.id || `${word.word}-${idx}`}
                            className="slider-item"
                            data-index={idx}
                          >
                            <WordCard wordData={word} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="vocabulary-list-section">
                    <div className="vocab-list">
                      {flattened.length > 0 ? (
                        flattened.map((word, index) => (
                          <div
                            key={word.id || `${word.word}-${index}`}
                            className={`vocab-list-item glass ${selectedWordIndex === index ? 'active' : ''} ${word.isDerivative ? 'is-derivative' : ''}`}
                            onClick={() => {
                              isScrollingRef.current = true;
                              setSelectedWordIndex(index);
                            }}
                          >
                            <span 
                              className="word" 
                              style={{ 
                                fontSize: word.word.length > 12 ? '0.85rem' : (word.word.length > 10 ? '0.95rem' : '1.1rem') 
                              }}
                            >
                              {word.word}
                            </span>
                            <span className="pos">{word.pos}</span>
                            <span className="meaning">{word.meaning}</span>
                            <div className="actions">
                              <button
                                className="list-action-btn speak-btn no-flip"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speak(word.word);
                                }}
                                title="發音"
                              >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </svg>
                              </button>
                              <button
                                className={`list-action-btn star-btn no-flip ${starredWords.some(w => w.word === word.word) ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStar(word);
                                }}
                                title="加入收藏"
                              >
                                <svg viewBox="0 0 24 24" width="18" height="18">
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={starredWords.some(w => w.word === word.word) ? 'var(--star)' : 'none'} stroke={starredWords.some(w => w.word === word.word) ? 'var(--star)' : 'currentColor'} strokeWidth="2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-msg">找不到符合的單字</p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <nav className="main-nav glass">
        <div className="container nav-content">
          <div className="logo" onClick={() => { setView('home'); setSelectedBook(null); }}>WordVault</div>
          <div className="nav-links">
            <button className={`nav-link ${view === 'home' || view === 'list' ? 'active' : ''}`} onClick={() => setView('home')}>學單字</button>
            <button className={`nav-link ${view === 'starred' ? 'active' : ''}`} onClick={() => setView('starred')}>星號單字</button>
            <button className={`nav-link ${view === 'review' ? 'active' : ''}`} onClick={() => setView('review')}>複習區</button>
            <button className={`nav-link ${view === 'stats' ? 'active' : ''}`} onClick={() => setView('stats')}>學習狀況</button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          {renderContent()}
        </div>
      </main>

      <style jsx>{`
        .app-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .main-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          border-radius: 0;
          border-top: none;
          background: rgba(10, 10, 12, 0.8);
        }

        .nav-content {
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.5rem;
          cursor: pointer;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .nav-links {
          display: flex;
          gap: 1.5rem;
        }

        .nav-link {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
          padding: 8px 0;
          position: relative;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--text-primary);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--accent-gradient);
        }

        .main-content {
          flex: 1;
          padding-bottom: 4rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 0;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .unit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
        }

        .unit-btn {
          padding: 1.5rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }

        .unit-btn:hover {
          background: var(--accent-gradient);
          color: white;
          border-color: transparent;
          transform: scale(1.05);
        }

        .unit-btn.completed {
          border-color: var(--success);
          position: relative;
        }

        .unit-btn.completed .check {
          position: absolute;
          top: 4px;
          right: 4px;
          color: var(--success);
          font-size: 0.8rem;
        }

        .progress-info {
          font-size: 0.9rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 12px;
          border-radius: 20px;
        }

        .cursor-pointer {
          cursor: pointer;
        }

        .word-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .loading-state, .empty-msg {
          text-align: center;
          padding: 4rem;
          color: var(--text-secondary);
        }

        @media (max-width: 640px) {
          .word-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
