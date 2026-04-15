import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Info, Pill, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { drugDatabase } from '../data/drugDatabase';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const DrugSearch: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [drugResult, setDrugResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [language, setLanguage] = useState('en');
  const [translatedResult, setTranslatedResult] = useState<any>(null);
  const [translationCache, setTranslationCache] = useState<Record<string, any>>({});

  const translateText = async (text: string, targetLang: string) => {
    if (targetLang === 'en') return text;
    const cacheKey = `${text}-${targetLang}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    const prompt = `Translate the following medical information into ${targetLang === 'hi' ? 'Hindi' : 'Marathi'}. Keep it simple and safe for patients:\n\n${text}`;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional healthcare assistant. Provide safe, medically responsible translations. Keep it simple and safe for patients."
        }
      });
      
      const translated = response.text?.trim() || text;
      setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }));
      return translated;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (lang === 'en') {
      setTranslatedResult(null);
      return;
    }
    if (!drugResult) return;

    const translated = {
      name: drugResult.name,
      use: await translateText(drugResult.use, lang),
      sideEffects: await translateText(drugResult.sideEffects, lang),
      whenToTake: await translateText(drugResult.whenToTake, lang),
      food: await translateText(drugResult.food, lang),
      interactions: await translateText(drugResult.interactions, lang),
      alternative: await translateText(drugResult.alternative, lang),
    };
    setTranslatedResult(translated);
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    setTranslatedResult(null);
    setLanguage('en');
    if (!q) {
      setDrugResult(null);
      setSuggestions([]);
      return;
    }

    const filtered = drugDatabase.filter(drug => 
      drug.name.toLowerCase().includes(q.toLowerCase())
    );
    setSuggestions(filtered);

    const result = drugDatabase.find(
      (drug) => drug.name.toLowerCase() === q.toLowerCase()
    );

    if (result) {
      setDrugResult(result);
    } else {
      setDrugResult(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-xl glass hover:bg-white/10 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-bold">Drug Information Search</h2>
      </div>

      <div className="relative mb-8">
        <input 
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a medicine..."
          className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all"
        />
        {suggestions.length > 0 && query.toLowerCase() !== (drugResult?.name.toLowerCase() || '') && (
          <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl border border-white/10 overflow-hidden z-20">
            {suggestions.map(s => (
              <button 
                key={s.name}
                onClick={() => handleSearch(s.name)}
                className="w-full px-6 py-3 text-left hover:bg-white/5 transition-all"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {drugResult ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-10 rounded-[40px] border border-brand-blue/30"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-bold text-brand-blue">{drugResult.name}</h3>
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
          <div className="space-y-4">
            <p><strong>Use:</strong> {(translatedResult || drugResult).use}</p>
            <p><strong>Side Effects:</strong> {(translatedResult || drugResult).sideEffects}</p>
            <p><strong>When to Take:</strong> {(translatedResult || drugResult).whenToTake}</p>
            <p><strong>Food:</strong> {(translatedResult || drugResult).food}</p>
            <p><strong>Interactions:</strong> {(translatedResult || drugResult).interactions}</p>
            <p><strong>Alternative:</strong> {(translatedResult || drugResult).alternative}</p>
          </div>
        </motion.div>
      ) : query && (
        <p className="text-center text-white/40">Medicine not found in database. Try another name.</p>
      )}
    </motion.div>
  );
};

export default DrugSearch;
