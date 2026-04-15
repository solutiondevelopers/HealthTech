import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Lightbulb, X } from 'lucide-react';
import { medicineData } from '../data/genericMedicineData';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const translations: Record<string, Record<string, string>> = {
  hi: {
    "Brand": "ब्रांड",
    "Generic": "जेनेरिक",
    "Use": "उपयोग",
    "Save": "बचत",
    "Price": "कीमत",
    "Search medicine": "दवा खोजें",
    "No results found": "कोई परिणाम नहीं मिला",
    "Side Effects": "दुष्प्रभाव",
    "When to Take": "कब लेना है",
    "Food": "भोजन चेतावनी",
    "Interactions": "दवाओं के साथ प्रतिक्रिया",
    "Price Logic": "मूल्य तर्क"
  },
  mr: {
    "Brand": "ब्रँड",
    "Generic": "जेनेरिक",
    "Use": "वापर",
    "Save": "बचत",
    "Price": "किंमत",
    "Search medicine": "औषध शोधा",
    "No results found": "कोणतेही निकाल सापडले नाहीत",
    "Side Effects": "दुष्परिणाम",
    "When to Take": "कधी घ्यावे",
    "Food": "अन्न चेतावणी",
    "Interactions": "औषधांच्या प्रतिक्रिया",
    "Price Logic": "किंमत तर्क"
  }
};

const GenericMedicineSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [translatedUse, setTranslatedUse] = useState<Record<string, string>>({});
  const [translationCache, setTranslationCache] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMedicines = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return medicineData.filter(m => {
      if (debouncedQuery.length === 1) {
        return m.brand.toLowerCase().startsWith(q) || m.generic.toLowerCase().startsWith(q);
      }
      return m.brand.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q);
    });
  }, [debouncedQuery]);

  const suggestions = useMemo(() => {
    return filteredMedicines.slice(0, 7);
  }, [filteredMedicines]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        selectSuggestion(suggestions[selectedIndex].brand);
      } else {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (brand: string) => {
    setQuery(brand);
    setDebouncedQuery(brand);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const translateUse = async (text: string, lang: string) => {
    if (lang === 'en') return text;
    const cacheKey = `${text}-${lang}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
      const prompt = `Translate this use description to ${lang === 'hi' ? 'Hindi' : 'Marathi'}: "${text}"`;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });
      const translated = response.text?.trim() || text;
      setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }));
      return translated;
    } catch (error: any) {
      console.error("Translation error:", error);
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429')) {
        // Silently fail and return original text for individual translations to avoid spamming alerts
        return text;
      }
      return text;
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (lang === 'en') {
      setTranslatedUse({});
      return;
    }
    
    try {
      const newTranslatedUse: Record<string, string> = {};
      for (const med of filteredMedicines) {
        newTranslatedUse[med.brand] = await translateUse(med.use, lang);
      }
      setTranslatedUse(newTranslatedUse);
    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429')) {
        alert("Translation failed due to high demand (Quota Exceeded). Please try again later.");
        setLanguage('en');
      }
    }
  };

  const t = (key: string) => {
    if (language === 'en') return key;
    return translations[language]?.[key] || key;
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto p-6 glass rounded-[40px] border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold">Generic Medicine & Price Comparison</h2>
        <select 
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="mr">मराठी</option>
        </select>
      </div>

      <div className="relative mb-8" ref={dropdownRef}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/40" />
        </div>
        <input 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("Search medicine (e.g. Crocin, Dolo, Paracetamol)")}
          className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all text-base"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setDebouncedQuery(''); }}
            className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
            >
              {suggestions.map((med, index) => (
                <button
                  key={med.brand}
                  onClick={() => selectSuggestion(med.brand)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left px-6 py-3 transition-all flex justify-between items-center ${
                    selectedIndex === index ? 'bg-white/10 text-brand-blue' : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{med.brand}</span>
                    <span className="text-xs opacity-50">{med.generic}</span>
                  </div>
                  {selectedIndex === index && <Search size={14} className="text-brand-blue" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-6">
        {filteredMedicines.length > 0 ? (
          filteredMedicines.map((med) => (
            <motion.div 
              key={med.brand}
              whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(6, 182, 212, 0.15)" }}
              className="glass p-6 md:p-8 rounded-[24px] border border-white/10 hover:border-brand-blue/40 transition-all duration-300 w-full"
            >
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                
                {/* LEFT SIDE: Summary Block */}
                <div className="w-full md:w-1/3 bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-white/5 shadow-inner">
                  <p className="text-[24px] font-bold text-white mb-1">{med.brand}</p>
                  <p className="text-[16px] text-white/70 mb-6">{med.generic}</p>
                  
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl">
                      <span className="text-white/60 text-sm font-medium">💰 {t("Price")}</span>
                      <span className="font-semibold text-lg">{med.price.split(' ')[0]}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl">
                      <span className="text-white/60 text-sm font-medium">💊 {t("Generic")}</span>
                      <span className="font-semibold text-lg">{med.genericPrice.split(' ')[0]}</span>
                    </div>
                  </div>
                  
                  <motion.div 
                    animate={{ opacity: [1, 0.8, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="mt-6 flex items-center justify-center gap-2 font-bold text-[22px] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-lg"
                  >
                    <span className="text-[24px]">💡</span>
                    <span>{t("Save")}: ₹{parseInt(med.price.replace('₹', '').split(' ')[0]) - parseInt(med.genericPrice.replace('₹', '').split(' ')[0])}</span>
                  </motion.div>
                </div>

                {/* VERTICAL DIVIDER (Desktop only) */}
                <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-brand-blue/30 to-transparent" />
                
                {/* HORIZONTAL DIVIDER (Mobile only) */}
                <div className="block md:hidden h-px w-full bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />

                {/* RIGHT SIDE: Details Block */}
                <div className="w-full md:w-2/3 flex flex-col justify-center space-y-4 text-[15px] md:text-[16px] leading-[1.7] text-white/80">
                  <p><strong className="text-white">📌 {t("Use")}:</strong> {translatedUse[med.brand] || med.use}</p>
                  <p><strong className="text-white">⚠️ {t("Side Effects")}:</strong> {med.sideEffects}</p>
                  <p><strong className="text-white">⏰ {t("When to Take")}:</strong> {med.whenToTake}</p>
                  <p><strong className="text-white">🍽 {t("Food")}:</strong> {med.foodWarning}</p>
                  <p><strong className="text-white">🔗 {t("Interactions")}:</strong> {med.interactionWarning}</p>
                  <div className="mt-2 p-4 bg-brand-blue/10 border border-brand-blue/20 rounded-xl">
                    <p><strong className="text-brand-blue">📊 {t("Price Logic")}:</strong> {med.priceLogic}</p>
                  </div>
                </div>

              </div>
            </motion.div>
          ))
        ) : debouncedQuery ? (
          <p className="col-span-full text-center text-white/40 py-12 text-xl font-medium">
            🔍 {t("No medicines found")}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default GenericMedicineSearch;
