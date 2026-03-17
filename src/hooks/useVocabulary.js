import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

export const useVocabulary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [words, setWords] = useState([]);

  const fetchWords = useCallback(async (book, unit) => {
    if (!API_URL) {
      console.warn('VITE_GOOGLE_APP_SCRIPT_URL is not set. Using mock data.');
      // Mock data for development
      const mockWords = Array.from({ length: 15 }, (_, i) => ({
        id: `m-${i}`,
        book: book || '基礎單字 I',
        unit: unit || 1,
        word: `Vantage-${i}`,
        pos: 'n.',
        meaning: `單字意思 ${i}`,
        example: `This is an example sentence for Vantage-${i}.`,
        phonetic: '/ˈvæn.tɪdʒ/',
        variations: 'vantages',
        phrases: 'at a vantage point'
      }));
      setWords(mockWords);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}?book=${encodeURIComponent(book)}&unit=${unit}`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      
      // Handle both [word, ...] and { success: true, data: [word, ...] }
      const finalWords = Array.isArray(data) ? data : (data.data || []);
      setWords(finalWords);
    } catch (err) {
      setError(err.message);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { words, setWords, loading, setLoading, error, fetchWords };
};
