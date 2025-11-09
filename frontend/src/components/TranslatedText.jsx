import { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

const TranslatedText = ({ children, className = '' }) => {
  const { translateText, language } = useTranslation();
  const [translatedText, setTranslatedText] = useState(children);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(children);
    } else {
      translateText(children).then(setTranslatedText);
    }
  }, [children, language, translateText]);

  return <span className={className}>{translatedText}</span>;
};

export default TranslatedText;