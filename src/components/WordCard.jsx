import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const WordCard = ({ wordData }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { starredWords, toggleStar } = useApp();
  
  const isStarred = starredWords.some(w => w.word === wordData.word);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleCardClick = (e) => {
    // Prevents flipping when clicking the star or speak buttons
    if (e.target.closest('.no-flip')) return;
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={`word-card-container ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
      <div className="word-card-inner">
        {/* Front Side */}
        <div className="word-card-front glass">
          <div className="card-header">
            <div className="badge pos-tag">{wordData.pos}</div>
            <button 
              className={`star-action-btn no-flip ${isStarred ? 'active' : ''}`}
              onClick={() => toggleStar(wordData)}
              aria-label="收藏單字"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={isStarred ? 'var(--star)' : 'none'} stroke={isStarred ? 'var(--star)' : 'currentColor'} strokeWidth="2"/>
              </svg>
            </button>
          </div>
          
          <div className="card-body main-display">
            <h2 className="display-word gradient-text">{wordData.word}</h2>
            <div className="pronunciation no-flip" onClick={() => speak(wordData.word)}>
              <span className="ipa">{wordData.phonetic}</span>
              <div className="audio-icon-wrapper">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="card-footer-hint">
            <div className="interaction-badge">
              <span>點擊翻面查看詳解</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="word-card-back glass">
          <div className="back-header">
             <div className="badge pos-tag">{wordData.pos}</div>
             <h3 className="definition">{wordData.meaning}</h3>
          </div>
          
          <div className="back-scroll-content">
            {/* Bilingual Example Section */}
            {(wordData.example_en || wordData.example) && (
              <div className="content-block">
                <div className="block-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  活用例句
                </div>
                <div className="bilingual-example">
                  <p className="example-en">{wordData.example_en || wordData.example}</p>
                  {wordData.example_ch && <p className="example-ch">{wordData.example_ch}</p>}
                </div>
              </div>
            )}

            {/* Phrases Section */}
            {wordData.phrases && wordData.phrases.length > 0 && (
              <div className="content-block">
                <div className="block-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  延伸片語
                </div>
                <div className="phrases-container">
                  {wordData.phrases.map((p, idx) => (
                    <div key={idx} className="phrase-block no-flip">
                      <div className="phrase-header">
                        <span className="phrase-en">{p.phrase_en}</span>
                        <span className="phrase-ch">{p.phrase_ch}</span>
                      </div>
                      {(p.phrase_ex_en || p.phrase_ex_ch) && (
                        <div className="phrase-ex">
                          {p.phrase_ex_en && <span className="phrase-ex-en">{p.phrase_ex_en}</span>}
                          {p.phrase_ex_ch && <span className="phrase-ex-ch">{p.phrase_ex_ch}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Derivatives/Variations Chips */}
            {(wordData.variations || (wordData.derivatives && wordData.derivatives.length > 0)) && (
              <div className="content-block">
                <div className="block-label">相關詞彙</div>
                <div className="derivatives-row">
                  {wordData.variations && <span className="der-chip">{wordData.variations}</span>}
                  {wordData.derivatives && wordData.derivatives.map(d => (
                    <div key={d.id || d.word} className="der-chip">
                      <span className="der-pos">{d.pos}</span>
                      {d.word}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="card-footer-hint reverse">
             <div className="interaction-badge">
               再次點擊回正面
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .word-card-container {
          perspective: 1200px;
          height: 380px;
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          cursor: pointer;
        }

        .word-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }

        .word-card-container.flipped .word-card-inner {
          transform: rotateY(180deg);
        }

        .word-card-front, .word-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          border-radius: 32px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .word-card-front {
          background: linear-gradient(135deg, rgba(30, 31, 45, 0.8), rgba(20, 21, 30, 0.9));
        }

        .word-card-back {
          background: linear-gradient(135deg, rgba(20, 21, 30, 0.9), rgba(30, 31, 45, 0.8));
          transform: rotateY(180deg);
        }

        .card-header, .back-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .pos-tag {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.8rem;
          background: rgba(99, 102, 241, 0.15);
          color: var(--accent-primary);
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }

        .star-action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--text-muted);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s;
        }

        .star-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .star-action-btn.active {
          color: var(--star);
        }

        .main-display {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
        }

        .display-word {
          font-family: var(--font-display);
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -1px;
        }

        .pronunciation {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 100px;
          transition: all 0.2s;
        }

        .pronunciation:hover {
           background: rgba(255, 255, 255, 0.08);
           transform: translateY(-2px);
        }

        .ipa {
          color: var(--text-secondary);
          font-size: 1.1rem;
          font-family: var(--font-main);
          font-weight: 500;
        }

        .audio-icon-wrapper {
          color: var(--accent-primary);
        }

        .definition {
          font-family: var(--font-display);
          font-size: 1.7rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          max-width: 80%;
        }

        .back-scroll-content {
          flex: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
          margin: 1.5rem 0;
        }

        .content-block {
          margin-bottom: 2rem;
        }

        .block-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }

        .example-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--text-primary);
          font-style: italic;
          opacity: 0.9;
        }

        .extra-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border-top: 1px solid var(--glass-border);
          padding-top: 1rem;
        }

        .detail-item {
          display: flex;
          gap: 0.5rem;
          font-size: 0.95rem;
        }

        .dt-label {
          color: var(--accent-secondary);
          font-weight: 700;
          flex-shrink: 0;
        }

        .card-footer-hint {
          display: flex;
          justify-content: center;
          opacity: 0.4;
        }

        .interaction-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.15);
          padding: 4px 12px;
          border-radius: 12px;
        }

        @media (max-height: 700px) {
          .word-card-container { height: 340px; }
          .display-word { font-size: 2.8rem; }
        }
      `}</style>
    </div>
  );
};

export default WordCard;
