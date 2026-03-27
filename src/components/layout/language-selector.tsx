'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', flag: '🇪🇺' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇺' },
  { code: 'ceb', name: 'Cebuano', flag: '🇵🇭' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'zh-TW', name: '中文 (繁體)', flag: '🇹🇼' },
  { code: 'co', name: 'Corsican', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'eo', name: 'Esperanto', flag: '🌍' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'fy', name: 'Frisian', flag: '🇳🇱' },
  { code: 'gl', name: 'Galego', flag: '🇪🇺' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸' },
  { code: 'he', name: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hmn', name: 'Hmong', flag: '🇨🇳' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'is', name: 'Íslenska', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ga', name: 'Gaeilge', flag: '🇮🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'jw', name: 'Javanese', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ku', name: 'Kurdish', flag: '🇮🇶' },
  { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', flag: '🇻🇦' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹' },
  { code: 'mi', name: 'Māori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
  { code: 'my', name: 'Burmese', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'or', name: 'Odia', flag: '🇮🇳' },
  { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸' },
  { code: 'gd', name: 'Scottish Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', flag: '🇸🇴' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'su', name: 'Sundanese', flag: '🇮🇩' },
  { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'ug', name: 'Uyghur', flag: '🇨🇳' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'cy', name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', flag: '🇮🇱' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
];

// Total: 103 languages

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const reposition = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: Math.max(r.width, 256) });
  }, []);

  useEffect(() => {
    if (isOpen) reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isOpen, reposition]);

  // Check for existing translation on mount
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const googtrans = getCookie('googtrans');
    if (googtrans) {
      const [, langCode] = googtrans.split('/').filter(Boolean);
      const lang = languages.find(l => l.code === langCode);
      if (lang) {
        setSelectedLang(lang);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLanguageSelect = (lang: typeof languages[0]) => {
    setSelectedLang(lang);
    setIsOpen(false);
    setSearchQuery(''); // Clear search when selecting
    
    // Set cookie for language (required by Google Translate)
    const domain = window.location.hostname.split('.').slice(-2).join('.');
    document.cookie = `googtrans=/en/${lang.code}; path=/; SameSite=lax`;
    document.cookie = `googtrans=/en/${lang.code}; path=/; domain=${domain}; SameSite=lax`;
    
    // Set document direction for RTL languages
    if (lang.dir === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    // Reload page to apply translation
    window.location.reload();
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        ref={btnRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full sm:w-auto space-x-2 px-3 py-2.5 rounded-md transition-colors border border-border",
          "hover:bg-accent hover:text-accent-foreground hover:border-primary",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "bg-white dark:bg-gray-800 shadow-sm dark:border-gray-600"
        )}
        aria-label="Select language"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Globe className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-lg">{selectedLang.flag}</span>
          <span className="text-sm font-medium truncate">{selectedLang.name}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'absolute', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-900 rounded-md shadow-xl border dark:border-gray-700 max-h-96 overflow-hidden flex flex-col">
            <div className="p-3 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0">
              <input
                type="text"
                placeholder="Search language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                {filteredLanguages.length} of {languages.length} languages
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between",
                      selectedLang.code === lang.code && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium"
                    )}
                    dir={lang.dir || "ltr"}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </div>
                    {selectedLang.code === lang.code && <span className="text-green-600 ml-2">✓</span>}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No languages found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
