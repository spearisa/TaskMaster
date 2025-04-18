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

interface LanguageRegionSelectorProps {
  variant?: 'default' | 'minimal';
}

export function LanguageRegionSelector({ variant = 'default' }: LanguageRegionSelectorProps) {
  const { 
    t, 
    i18n, 
    currentLanguage,
    changeLanguage, 
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
  }, []);
  
  // Handle region change
  const handleRegionChange = (regionCode: string) => {
    setCurrentRegion(regionCode);
    localStorage.setItem('appmoRegion', regionCode);
    const newLanguage = setLanguageByCountry(regionCode);
    console.log(`Region changed to ${regionCode}, language set to ${newLanguage}`);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant === 'minimal' ? "ghost" : "outline"} 
          size="icon" 
          className={variant === 'minimal' ? "rounded-full h-8 w-8 p-0" : "rounded-full"}
        >
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
                  onClick={() => {
                    // Use direct approach for language change
                    console.log(`Language selection clicked: ${language.code}`);
                    // First set in localStorage directly (this is what i18next reads on page load)
                    localStorage.setItem('i18nextLng', language.code);
                    // Then trigger language change in i18next
                    i18n.changeLanguage(language.code);
                    // Force reload after a short delay
                    setTimeout(() => {
                      console.log(`Forcing reload to apply language change to ${language.code}`);
                      window.location.href = window.location.href.split('?')[0]; // Remove any query params
                    }, 100);
                  }}
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
                    // Direct approach for region change as well
                    console.log(`Region selection clicked: ${region.code}`);
                    // First set directly in localStorage
                    localStorage.setItem('appmoRegion', region.code);
                    // Set language based on region
                    const languageCode = setLanguageByCountry(region.code);
                    console.log(`Region ${region.code} maps to language ${languageCode}`);
                    // First set in localStorage directly (this is what i18next reads on page load)
                    localStorage.setItem('i18nextLng', languageCode);
                    // Then trigger language change in i18next
                    i18n.changeLanguage(languageCode);
                    // Force reload after a short delay
                    setTimeout(() => {
                      console.log(`Forcing reload to apply region/language change`);
                      window.location.href = window.location.href.split('?')[0]; // Remove any query params
                    }, 100);
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