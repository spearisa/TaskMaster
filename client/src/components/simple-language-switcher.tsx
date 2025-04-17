import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

// Simple language options - just the most common ones
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
];

export function SimpleLanguageSwitcher() {
  // Direct language switch - completely bypasses i18next's methods
  const switchLanguage = (langCode: string) => {
    console.log(`Switching to ${langCode} using direct method`);
    
    // Set language in localStorage
    localStorage.setItem('i18nextLng', langCode);
    
    // Force reload the entire page
    window.location.reload();
  };
  
  // Get current language from localStorage if available
  const currentLang = localStorage.getItem('i18nextLng') || 'en';
  
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-semibold ml-2">Languages</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {languages.map(lang => (
            <Button
              key={lang.code}
              variant={currentLang === lang.code ? "default" : "outline"}
              size="sm"
              onClick={() => switchLanguage(lang.code)}
              className="text-xs"
            >
              {lang.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}