import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

export const useVocabulary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [words, setWords] = useState([]);

  const fetchWords = useCallback(async (book, unit) => {
    if (!API_URL) {
      console.warn('VITE_GOOGLE_APP_SCRIPT_URL is not set. Using mock data.');
      const mockWords = [
        {
          id: '123-0',
          word: 'vantage',
          pos: 'n.',
          meaning: '優勢，有利地位',
          example_en: 'The scouts had found a location that provided a good vantage point.',
          example_ch: '偵察兵找到了一個可以提供良好視野的有利位置。',
          phrases: [
            {
              phrase_en: 'vantage point',
              phrase_ch: '有利位置；觀點',
              phrase_ex_en: 'From this vantage point, we can see the entire valley.',
              phrase_ex_ch: '從這個位置，我們可以看到整個山谷。'
            }
          ],
          derivatives: [
            { id: '123-1', word: 'advantaged', pos: 'adj.', meaning: '處於有利地位的；優越的', example_en: 'Students from advantaged backgrounds often perform better.', example_ch: '背景優越的學生往往表現更好。' }
          ]
        },
        {
          id: '124-0',
          word: 'procrastinate',
          pos: 'v.',
          meaning: '拖延，耽擱',
          example_en: 'He tends to procrastinate until the very last minute.',
          example_ch: '他傾向於拖延到最後一刻。',
          phrases: []
        }
      ];
      setWords(mockWords);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}?book=${encodeURIComponent(book)}&unit=${unit}`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      
      // Handle { success: true, data: [word, ...] } or old [word, ...]
      let finalWords = [];
      if (Array.isArray(data)) {
        finalWords = data;
      } else if (data && data.success && Array.isArray(data.data)) {
        finalWords = data.data;
      } else if (data && data.data && Array.isArray(data.data)) {
        finalWords = data.data;
      }

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
