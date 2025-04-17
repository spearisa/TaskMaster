import { useCallback } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { 
  getAvailableLanguages, 
  getAvailableRegions, 
  setLanguageByCountry 
} from '@/lib/i18n';

// Enhanced translation hook with additional language utilities
export function useTranslation() {
  const { t, i18n: i18nInstance } = useI18nTranslation();
  
  // Get current language code
  const currentLanguage = i18nInstance.language || 'en';
  
  // Get language name from code
  const getLanguageName = useCallback((code: string): string => {
    const language = getAvailableLanguages().find(lang => lang.code === code);
    return language ? language.name : code;
  }, []);
  
  // Get region name from code
  const getRegionName = useCallback((code: string): string => {
    const region = getAvailableRegions().find(reg => reg.code === code);
    return region ? region.name : code;
  }, []);
  
  // Change language with hard reload
  const changeLanguage = useCallback((languageCode: string) => {
    console.log(`Changing language to ${languageCode}`);
    // Set language in localStorage directly
    localStorage.setItem('i18nextLng', languageCode);
    // Also change i18n instance
    i18nInstance.changeLanguage(languageCode);
    // Let's force app to use the new language by adding a timestamp to localStorage
    localStorage.setItem('appmo_lang_updated', Date.now().toString());
    console.log(`Language changed to ${languageCode}, reloading page...`);
    
    // Return the language code for reference
    return languageCode;
  }, [i18nInstance]);
  
  return {
    t,
    i18n: i18nInstance,
    currentLanguage,
    changeLanguage,
    getLanguageName,
    getRegionName,
    getAvailableLanguages,
    getAvailableRegions,
    setLanguageByCountry
  };
}