import React from 'react';
import { useApp } from '../context/AppContext';

const books = [
  { id: 1, title: '基礎單字 I', level: 'Basic', units: 40, color: '#6366f1' },
  { id: 2, title: '基礎單字 II', level: 'Basic', units: 40, color: '#8b5cf6' },
  { id: 3, title: '進階單字 I', level: 'Advanced', units: 40, color: '#ec4899' },
  { id: 4, title: '進階單字 II', level: 'Advanced', units: 40, color: '#f43f5e' },
];

const BookSelection = () => {
  const { setSelectedBook, setSelectedUnit } = useApp();

  const handleSelect = (book) => {
    setSelectedBook(book);
    setSelectedUnit(null); // Reset unit when book changes
  };

  return (
    <div className="book-selection fade-in">
      <header className="hero">
        <h1 className="gradient-text">WordVault</h1>
        <p>提升你的英語實力，從掌握每一單字開始</p>
      </header>

      <div className="book-grid">
        {books.map((book) => (
          <div 
            key={book.id} 
            className="book-card glass"
            onClick={() => handleSelect(book)}
          >
            <div className="book-level" style={{ backgroundColor: book.color }}>{book.level}</div>
            <div className="book-info">
              <h3>{book.title}</h3>
              <p>{book.units} Units</p>
            </div>
            <div className="book-arrow">→</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .hero {
          text-align: center;
          padding: 4rem 0;
        }

        .hero h1 {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .hero p {
          color: var(--text-secondary);
          font-size: 1.2rem;
        }

        .book-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .book-card {
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 200px;
        }

        .book-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-primary);
        }

        .book-level {
          position: absolute;
          top: 0;
          left: 0;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          border-bottom-right-radius: 12px;
          text-transform: uppercase;
        }

        .book-info h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .book-info p {
          color: var(--text-secondary);
        }

        .book-arrow {
          align-self: flex-end;
          font-size: 1.5rem;
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
};

export default BookSelection;
