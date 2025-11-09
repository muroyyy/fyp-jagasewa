import { useState, useEffect } from 'react';

export const useTranslation = () => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [translations, setTranslations] = useState({});

  const translateText = async (text, targetLang = language) => {
    if (targetLang === 'en') return text;
    
    const cacheKey = `${text}_${targetLang}`;
    if (translations[cacheKey]) {
      return translations[cacheKey];
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/translate.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang: 'en'
        })
      });

      const data = await response.json();
      if (data.success) {
        setTranslations(prev => ({
          ...prev,
          [cacheKey]: data.translatedText
        }));
        return data.translatedText;
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
    
    return text;
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return { language, translateText, changeLanguage };
};