import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Check, Globe } from 'lucide-react';

// Service to detect user's country based on IP
async function detectUserCountry(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code || 'US';
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'US'; // Default to US if detection fails
  }
}

// This is a completely new approach using direct URL manipulation
// to force a hard reload with the language parameter
function changeAppLanguage(languageCode: string) {
  console.log(`Setting language to: ${languageCode}`);
  localStorage.setItem('i18nextLng', languageCode);
  // Create a form that will submit and cause a full page reload
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = window.location.pathname;
  
  // Add a hidden field for the language
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = '_lang'; // Custom parameter to force refresh
  input.value = languageCode;
  
  // Add the timestamp to force reload
  const timestamp = document.createElement('input');
  timestamp.type = 'hidden';
  timestamp.name = '_t';
  timestamp.value = Date.now().toString();
  
  form.appendChild(input);
  form.appendChild(timestamp);
  document.body.appendChild(form);
  form.submit();
}

export function LanguageRegionSelector() {
  const { 
    t, 
    i18n, 
    currentLanguage,
    getLanguageName,
    getRegionName,
    getAvailableLanguages,
    getAvailableRegions,
    setLanguageByCountry
  } = useTranslation();
  
  const [currentRegion, setCurrentRegion] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  
  const languages = getAvailableLanguages();
  const regions = getAvailableRegions();
  
  // Detect user's country and set language on component mount
  useEffect(() => {
    async function detectAndSetLanguage() {
      setIsDetectingLocation(true);
      try {
        const countryCode = await detectUserCountry();
        setCurrentRegion(countryCode);
        setLanguageByCountry(countryCode);
      } catch (error) {
        console.error('Error setting language by country:', error);
      } finally {
        setIsDetectingLocation(false);
      }
    }
    
    // Only detect if we don't already have a language preference
    const savedLanguage = localStorage.getItem('i18nextLng');
    const savedRegion = localStorage.getItem('appmoRegion');
    
    if (savedLanguage && savedRegion) {
      setCurrentRegion(savedRegion);
      setIsDetectingLocation(false);
    } else {
      detectAndSetLanguage();
    }

    // Check URL params for language change
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('_lang');
    if (langParam) {
      console.log(`Language param found in URL: ${langParam}`);
      i18n.changeLanguage(langParam);
    }
  }, []);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('common.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isDetectingLocation ? (
          <div className="flex items-center justify-center p-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            <input 
              type="text" 
              placeholder={t('common.search')} 
              className="w-full px-2 py-1 mb-2 text-sm border rounded"
              onChange={(e) => {
                const input = e.target.value.toLowerCase();
                const container = e.target.parentElement;
                if (container) {
                  const items = container.querySelectorAll('div[data-language-item]');
                  items.forEach(item => {
                    const text = item.textContent?.toLowerCase() || '';
                    if (text.includes(input)) {
                      item.classList.remove('hidden');
                    } else {
                      item.classList.add('hidden');
                    }
                  });
                }
              }}
            />
            {languages.map((language) => (
              <div 
                key={language.code} 
                data-language-item="true"
                className="cursor-pointer"
              >
                <DropdownMenuItem
                  className="flex justify-between"
                  onClick={() => changeAppLanguage(language.code)}
                >
                  {language.name}
                  {currentLanguage === language.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              </div>
            ))}
          </div>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('common.region')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isDetectingLocation ? (
          <div className="flex items-center justify-center p-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
            <span className="text-sm">{t('common.loading')}</span>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            <input 
              type="text" 
              placeholder={t('common.search')} 
              className="w-full px-2 py-1 mb-2 text-sm border rounded"
              onChange={(e) => {
                const input = e.target.value.toLowerCase();
                const container = e.target.parentElement;
                if (container) {
                  const items = container.querySelectorAll('div[data-region-item]');
                  items.forEach(item => {
                    const text = item.textContent?.toLowerCase() || '';
                    if (text.includes(input)) {
                      item.classList.remove('hidden');
                    } else {
                      item.classList.add('hidden');
                    }
                  });
                }
              }}
            />
            {regions.map((region) => (
              <div 
                key={region.code} 
                data-region-item="true"
                className="cursor-pointer"
              >
                <DropdownMenuItem
                  className="flex justify-between"
                  onClick={() => {
                    // Set region in localStorage
                    localStorage.setItem('appmoRegion', region.code);
                    // Get corresponding language and change to it
                    const languageForRegion = (region.code in setLanguageByCountry) 
                      ? setLanguageByCountry(region.code) 
                      : 'en';
                    // Use the same form submission approach
                    changeAppLanguage(languageForRegion);
                  }}
                >
                  {region.name}
                  {currentRegion === region.code && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}