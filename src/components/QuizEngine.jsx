import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const QuizEngine = ({ words, onComplete, onCancel }) => {
  const { addMistake } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect: boolean, correctAnswer: string }

  // Generate Questions
  useEffect(() => {
    if (!words || words.length === 0) return;
    
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10); // 10 questions max

    const generated = selected.map((word, index) => {
      const type = Math.random() > 0.5 ? 'choice' : 'fill';
      
      if (type === 'choice') {
        // Get 3 wrong answers from other words in the unit
        const wrongAnswers = words
          .filter(w => w.word !== word.word)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map(w => w.meaning);
        
        const options = [...wrongAnswers, word.meaning].sort(() => 0.5 - Math.random());
        
        return {
          id: index,
          type,
          word: word.word,
          question: `請問單字 「${word.word}」 的中文解釋是？`,
          options,
          correctAnswer: word.meaning,
          wordObj: word
        };
      } else {
        return {
          id: index,
          type,
          word: word.word,
          question: `請拼寫出代表 「${word.meaning}」 的英文單字 (${word.pos})`,
          correctAnswer: word.word,
          wordObj: word
        };
      }
    });

    setQuestions(generated);
  }, [words]);

  const handleAnswer = (answer) => {
    if (feedback) return; // Prevent multiple answers

    const currentQ = questions[currentStep];
    const isCorrect = answer.trim().toLowerCase() === currentQ.correctAnswer.toLowerCase();
    
    setFeedback({ isCorrect, correctAnswer: currentQ.correctAnswer, userAnswer: answer });
    
    if (!isCorrect) {
      addMistake(currentQ.wordObj);
    }

    setTimeout(() => {
      setUserAnswers([...userAnswers, { ...currentQ, userAnswer: answer, isCorrect }]);
      if (isCorrect) setScore(score + 1);
      
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
        setFeedback(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (questions.length === 0) return <div>準備題目中...</div>;

  if (showResult) {
    const accuracy = Math.round((score / questions.length) * 100);
    const getPerformanceMsg = () => {
      if (accuracy === 100) return '完美！你是天生的單字王 👑';
      if (accuracy >= 80) return '優秀！實力非常驚人 ✨';
      if (accuracy >= 60) return '好棒！繼續保持進步 📈';
      return '加油！再複習一下就會更好 💪';
    };

    return (
      <div className="quiz-result glass fade-in">
        <div className="result-header">
          <div className="result-icon">{accuracy >= 60 ? '🎯' : '📝'}</div>
          <h2>測驗結算</h2>
          <p className="performance-msg">{getPerformanceMsg()}</p>
        </div>

        <div className="stats-row">
          <div className="result-stat glass">
            <span className="label">正確率</span>
            <span className="value gradient-text">{accuracy}%</span>
          </div>
          <div className="result-stat glass">
            <span className="label">答對題數</span>
            <span className="value">{score} / {questions.length}</span>
          </div>
        </div>

        {userAnswers.filter(a => !a.isCorrect).length > 0 ? (
          <div className="wrong-list-container glass">
            <h3>需加強的單字</h3>
            <div className="wrong-list">
              {userAnswers.filter(a => !a.isCorrect).map(a => (
                <div key={a.id} className="wrong-item">
                  <div className="word-info">
                    <span className="word">{a.word}</span>
                    <span className="pos">{a.wordObj.pos}</span>
                  </div>
                  <div className="answer-info">
                    <span class="correct-val">{a.correctAnswer}</span>
                    <span class="user-val">你填寫：{a.userAnswer || '(未填)'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="perfect-msg glass">
             🎉 全對！目前沒有需要複習的單字
          </div>
        )}

        <div className="quiz-actions">
           <button className="btn btn-primary btn-lg" onClick={onCancel}>確認並返回</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentStep];

  return (
    <div className="quiz-container glass fade-in">
      <div className="quiz-header">
        <span className="progress">問題 {currentStep + 1} / {questions.length}</span>
        <button className="btn-close" onClick={onCancel}>✕</button>
      </div>

      <div className="quiz-body">
        <div className="question-meta glass">
          <span className="type-badge">{currentQ.type === 'choice' ? '多選題' : '拼字題'}</span>
        </div>
        <h3 className="question-text">{currentQ.question}</h3>
        
        {currentQ.type === 'choice' ? (
          <div className="options-grid">
            {currentQ.options.map((opt, i) => (
              <button 
                key={i} 
                className={`option-btn glass ${feedback?.correctAnswer === opt ? 'correct' : (feedback && !feedback.isCorrect && feedback.userAnswer === opt ? 'wrong' : '')}`}
                onClick={() => handleAnswer(opt)}
                disabled={!!feedback}
              >
                <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                <span className="option-content">{opt}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="fill-input-container">
            <input 
              type="text" 
              className="fill-input glass"
              placeholder="請在這裡輸入單字..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnswer(e.target.value);
              }}
              disabled={!!feedback}
            />
            {feedback && (
              <div className={`feedback-msg ${feedback.isCorrect ? 'correct' : 'wrong'} glass`}>
                {feedback.isCorrect ? '✨ 正確！太棒了' : `❌ 錯誤，正確答案是：${feedback.correctAnswer}`}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .quiz-container {
          padding: 3rem 2rem;
          max-width: 800px;
          margin: 2rem auto;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
        }

        .progress {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.1rem;
        }

        .btn-close {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: var(--error);
          color: white;
        }

        .question-meta {
          display: inline-block;
          padding: 4px 12px;
          margin-bottom: 1.5rem;
          border-radius: 20px;
        }

        .type-badge {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .question-text {
          font-size: 2.2rem;
          margin-bottom: 3rem;
          text-align: center;
          line-height: 1.4;
          color: var(--text-primary);
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.25rem;
        }

        .option-btn {
          padding: 1.5rem;
          text-align: left;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-primary);
        }

        .option-label {
          font-weight: 700;
          color: var(--accent-primary);
          opacity: 0.8;
        }

        .option-btn:hover:not(:disabled) {
           border-color: var(--accent-primary);
           background: rgba(99, 102, 241, 0.1);
           transform: translateX(5px);
        }

        .option-btn.correct {
          background: var(--success);
          color: white;
          border-color: transparent;
        }
        
        .option-btn.correct .option-label { color: white; }

        .option-btn.wrong {
          background: var(--error);
          color: white;
          border-color: transparent;
        }
        
        .option-btn.wrong .option-label { color: white; }

        .fill-input-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
          width: 100%;
        }

        .fill-input {
          width: 100%;
          padding: 1.5rem;
          font-size: 2rem;
          text-align: center;
          border: 1px solid var(--glass-border);
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-weight: 600;
        }

        .fill-input:focus {
           border-color: var(--accent-primary);
           box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
        }

        .feedback-msg {
          padding: 1rem 2rem;
          font-weight: 600;
          font-size: 1.2rem;
          width: 100%;
          text-align: center;
        }

        .feedback-msg.correct { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .feedback-msg.wrong { background: rgba(239, 68, 68, 0.1); color: var(--error); }

        .quiz-result {
          padding: 4rem 2rem;
          text-align: center;
        }

        .score-badge {
          font-size: 5rem;
          text-align: center;
          margin: 2rem 0;
          font-family: var(--font-display);
        }

        .score {
          color: var(--accent-primary);
          font-weight: 800;
        }

        .wrong-list {
          max-width: 500px;
          margin: 0 auto 3rem;
          text-align: left;
        }

        .wrong-list h3 {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
        }

        .wrong-item {
          display: flex;
          justify-content: space-between;
          padding: 1.25rem 0;
          border-bottom: 1px solid var(--glass-border);
        }

        .wrong-item .word { font-weight: 700; font-size: 1.1rem; }
        .wrong-item .meaning { color: var(--text-secondary); }

        @media (max-width: 640px) {
          .quiz-container { padding: 1.5rem; }
          .question-text { font-size: 1.6rem; }
          .fill-input { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default QuizEngine;
