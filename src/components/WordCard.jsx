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
            <span className="pos">{wordData.pos}</span>
            <button 
              className={`star-btn no-flip ${isStarred ? 'active' : ''}`}
              onClick={() => toggleStar(wordData)}
            >
              {isStarred ? '★' : '☆'}
            </button>
          </div>
          
          <div className="card-body">
            <h2 className="word-text">{wordData.word}</h2>
            <div className="audio-control no-flip" onClick={() => speak(wordData.word)}>
              <span className="phonetic">{wordData.phonetic}</span>
              <button className="speak-btn">🔊</button>
            </div>
          </div>
          
          <div className="card-footer">
            <p className="hint">點擊翻面查看解釋</p>
          </div>
        </div>

        {/* Back Side */}
        <div className="word-card-back glass">
          <div className="card-header">
             <span className="pos">{wordData.pos}</span>
             <h3 className="meaning">{wordData.meaning}</h3>
          </div>
          
          <div className="card-content">
            <div className="example-section">
              <h4>例句</h4>
              <p>{wordData.example}</p>
            </div>
            
            {(wordData.variations || wordData.phrases) && (
              <div className="extra-info">
                {wordData.variations && (
                  <div className="info-item">
                    <span className="label">變體：</span>
                    <span>{wordData.variations}</span>
                  </div>
                )}
                {wordData.phrases && (
                  <div className="info-item">
                    <span className="label">片語：</span>
                    <span>{wordData.phrases}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="card-footer">
             <p className="hint">再次點擊回正面</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .word-card-container {
          perspective: 1000px;
          height: 350px;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          cursor: pointer;
        }

        .word-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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
          padding: 1.5rem;
          justify-content: space-between;
        }

        .word-card-back {
          transform: rotateY(180deg);
          text-align: left;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pos {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--accent-secondary);
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s;
        }

        .star-btn.active {
          color: var(--star);
        }

        .word-text {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .phonetic {
          color: var(--text-secondary);
          font-family: var(--font-main);
          font-size: 1.1rem;
        }

        .speak-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2rem;
          margin-left: 0.5rem;
        }

        .meaning {
          font-size: 1.5rem;
          margin: 0;
          color: var(--accent-primary);
        }

        .example-section h4 {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .example-section p {
          font-style: italic;
          line-height: 1.5;
        }

        .extra-info {
           margin-top: 1rem;
           font-size: 0.9rem;
           border-top: 1px solid var(--glass-border);
           padding-top: 0.5rem;
        }

        .info-item {
          margin-top: 0.25rem;
        }

        .label {
          color: var(--text-secondary);
        }

        .card-footer .hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default WordCard;
