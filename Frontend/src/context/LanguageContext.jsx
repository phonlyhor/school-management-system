import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default language is 'kh' (Khmer)
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('app_lang') || 'kh';
    });

    useEffect(() => {
        localStorage.setItem('app_lang', lang);
    }, [lang]);

    const toggleLanguage = (newLang) => {
        setLang(newLang);
    };

    // Helper translation function t(khText, enText)
    const t = (khText, enText) => {
        return lang === 'en' ? (enText || khText) : (khText || enText);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
