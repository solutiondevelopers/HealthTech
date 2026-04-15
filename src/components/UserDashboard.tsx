import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from '../firebase';
import { drugInteractions, ayurvedaInteractions, foodInteractions, synonymsMap } from '../data/drugInteractions';
import DrugSearch from './DrugSearch';
import GenericMedicineSearch from './GenericMedicineSearch';
import AIPrescriptionScanner from './AIPrescriptionScanner';
import HomeRemedies from './HomeRemedies';
import MedicineStoreLocator from './MedicineStoreLocator';
import NearbyDoctors from './NearbyDoctors';
import DoctorConsultation from './DoctorConsultation';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Pill, 
  Scan, 
  UserRound, 
  Stethoscope, 
  ShoppingBag, 
  Settings, 
  Search, 
  Mail, 
  Bell, 
  ChevronDown, 
  Mic, 
  Upload,
  Plus,
  Apple,
  Smartphone,
  Activity,
  Send,
  User as UserIcon,
  Bot,
  Database,
  FileText,
  Leaf,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  HeartPulse,
  Trash2,
  Share2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Info,
  LogOut
} from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

interface UserDashboardProps {
  onLogout: () => void;
  t: any;
}


const FloatingParticle: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 0.5, 0],
      scale: [0, 1, 0],
      y: [0, -100, -200],
      x: [0, Math.random() * 50 - 25, Math.random() * 100 - 50]
    }}
    transition={{ 
      duration: 5 + Math.random() * 5, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut"
    }}
    className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
    style={{ 
      left: `${Math.random() * 100}%`, 
      top: `${Math.random() * 100}%` 
    }}
  />
);

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false, onClick, onDelete }) => (
  <motion.div
    whileHover={{ x: 5 }}
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-all relative group ${
      active ? 'text-white' : 'text-white/40 hover:text-white/70'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-blue to-brand-purple shadow-[0_0_15px_rgba(6,182,212,0.8)]"
      />
    )}
    <div className={`transition-all duration-300 ${active ? 'text-brand-blue drop-shadow-neon-blue' : 'group-hover:text-brand-blue/70'}`}>
      {icon}
    </div>
    <span className="text-sm font-medium tracking-wide flex-1 truncate">{label}</span>
    {onDelete && (
      <motion.button
        whileHover={{ scale: 1.2, color: '#ef4444' }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-500"
      >
        <Trash2 size={14} />
      </motion.button>
    )}
    {active && (
      <div className="absolute inset-0 bg-white/5 blur-sm -z-10 rounded-r-xl" />
    )}
  </motion.div>
);

interface FeatureCardProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, label, color, onClick }) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.05 }}
    onClick={onClick}
    className="glass p-6 rounded-[32px] border border-white/5 flex flex-col items-center justify-center gap-4 w-full aspect-square min-w-[160px] max-w-[160px] cursor-pointer group relative overflow-hidden shrink-0"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div 
      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
      style={{ 
        background: `${color}15`,
        boxShadow: `inset 0 0 20px ${color}10`
      }}
    >
      <div style={{ color: color }} className="drop-shadow-lg">
        {icon}
      </div>
    </div>
    <span className="text-xs font-bold text-white/60 text-center uppercase tracking-wider group-hover:text-white transition-colors">
      {label}
    </span>
    {/* Glow Border */}
    <div className="absolute inset-0 rounded-[32px] border-2 border-transparent group-hover:border-white/10 transition-all pointer-events-none" />
  </motion.div>
);

const FeatureCarousel = ({ onFeatureClick }: { onFeatureClick: (label: string) => void }) => {
  const features = [
    { icon: <Pill size={32} />, label: "Drug Interaction Checker", color: "#8b5cf6" },
    { icon: <Search size={32} />, label: "Drug Information Search", color: "#06b6d4" },
    { icon: <Database size={32} />, label: "Generic Medicine Suggestion", color: "#ec4899" },
    { icon: <ShoppingBag size={32} />, label: "Medicine Store Locator", color: "#8b5cf6" },
    { icon: <Scan size={32} />, label: "AI Prescription Scanner", color: "#06b6d4" },
    { icon: <FileText size={32} />, label: "AI Conversation Summary", color: "#ec4899" },
    { icon: <Bot size={32} />, label: "AI Health Assistant", color: "#8b5cf6" },
    { icon: <Stethoscope size={32} />, label: "Doctor Consultation", color: "#06b6d4" },
    { icon: <Leaf size={32} />, label: "Home Remedies", color: "#ec4899" },
    { icon: <AlertTriangle size={32} />, label: "Drug + Food Alerts", color: "#8b5cf6" },
    { icon: <MapPin size={32} />, label: "Nearby Doctors", color: "#06b6d4" },
    { icon: <ShieldCheck size={32} />, label: "Data Privacy & Security", color: "#ec4899" },
  ];

  // Double the features for infinite scroll
  const scrollFeatures = [...features, ...features];

  return (
    <div className="w-full max-w-6xl overflow-hidden relative py-10 group/carousel">
      {/* Gradient Fades */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#030305] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#030305] to-transparent z-10" />
      
      <motion.div
        className="flex gap-6"
        animate={{
          x: [0, -186 * features.length] // 160px width + 26px gap (approx)
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        whileHover={{ animationPlayState: "paused" }}
      >
        {scrollFeatures.map((feature, i) => (
          <FeatureCard
            key={i}
            icon={feature.icon}
            label={feature.label}
            color={feature.color}
            onClick={() => onFeatureClick(feature.label)}
          />
        ))}
      </motion.div>
    </div>
  );
};

const SuvidhaView: React.FC<{ onFeatureClick: (label: string) => void }> = ({ onFeatureClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-6xl"
  >
    <div className="mb-12">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">
        Suvidha - <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink">Smart Healthcare Services</span>
      </h1>
      <p className="text-white/40 text-lg">Access all healthcare features in one place</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: "Drug Interaction Checker", desc: "Check interactions (Allopathy + Ayurveda + Unani + Food)", icon: <Pill className="text-brand-pink" />, color: "#ec4899", section: 'checker' },
        { title: "Drug Information Search", desc: "Search drug information and drug search", icon: <Search className="text-brand-blue" />, color: "#06b6d4", section: 'drugSearch' },
        { title: "Generic Medicine & Price Comparison", desc: "Compare price for and price comparison", icon: <Database className="text-brand-purple" />, color: "#8b5cf6", section: 'genericSearch' },
        { title: "Medicine Store Locator", desc: "Find the nearest store locator at this site", icon: <ShoppingBag className="text-brand-blue" />, color: "#06b6d4", section: 'storeLocator' },
        { title: "AI Prescription Scanner", desc: "Learn about your prescription scanner", icon: <Scan className="text-brand-pink" />, color: "#ec4899", section: 'prescriptionScanner' },
        { title: "AI Health Assistant", desc: "AI health assistance or AI health assistant", icon: <Bot className="text-brand-purple" />, color: "#8b5cf6" },
        { title: "Doctor Consultation", desc: "Check your doctor consultation summary", icon: <Stethoscope className="text-brand-blue" />, color: "#06b6d4", section: 'doctorConsultation' },
        { title: "Home Remedies", desc: "Help you get the home home remedies", icon: <Leaf className="text-brand-pink" />, color: "#ec4899", section: 'homeRemedies' },
        { title: "Safety Alerts (Drug + Food)", desc: "Stay to maintain with your safety alerts", icon: <AlertTriangle className="text-brand-purple" />, color: "#8b5cf6" },
        { title: "Nearby Doctors", desc: "Doctors connected by the nearby doctor and doctors", icon: <MapPin className="text-brand-blue" />, color: "#06b6d4", section: 'nearbyDoctors' },
        { title: "Secure Data & Privacy", desc: "Secure your screen in secure privacy", icon: <ShieldCheck className="text-brand-pink" />, color: "#ec4899" },
        { title: "Generic Medicine Alternatives", desc: "Generic medicine and price comparison", icon: <Activity className="text-brand-purple" />, color: "#8b5cf6" },
      ].map((item, i) => (
        <motion.div
          key={i}
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => onFeatureClick(item.section || item.title)}
          className="glass p-8 rounded-[40px] border border-white/5 group cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
            style={{ 
              background: `${item.color}15`,
              boxShadow: `inset 0 0 20px ${item.color}10`
            }}
          >
            <div style={{ color: item.color }}>
              {item.icon}
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-brand-blue transition-colors">{item.title}</h3>
          <p className="text-white/40 text-xs leading-relaxed group-hover:text-white/60 transition-colors line-clamp-1">{item.desc}</p>
          <div className="mt-6 flex items-center gap-2 text-brand-blue text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            Open Feature <Plus size={12} />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const InteractionChecker: React.FC<{ onBack: () => void, onAskAI: (query: string) => void }> = ({ onBack, onAskAI }) => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [med1, setMed1] = useState('');
  const [med2, setMed2] = useState('');
  const [optional, setOptional] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [language, setLanguage] = useState('en');
  const [translatedResult, setTranslatedResult] = useState<any>(null);
  const [translationCache, setTranslationCache] = useState<Record<string, any>>({});
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);

  const suggestions1 = useMemo(() => {
    let list: string[] = [];
    if (category === 'Allopathy + Food') {
      list = [...foodInteractions.map(i => i.medicine)];
    } else if (category === 'Ayurveda + Allopathy') {
      list = [...ayurvedaInteractions.map(i => i.medicine1), ...ayurvedaInteractions.map(i => i.medicine2)];
    } else {
      list = [...drugInteractions.map(i => i.drug1), ...drugInteractions.map(i => i.drug2)];
    }
    const validTargets = new Set(list.map(i => i.toLowerCase()));
    const relevantSynonyms = Object.entries(synonymsMap)
      .filter(([k, v]) => validTargets.has(v.toLowerCase()))
      .map(([k, v]) => k);
      
    const unique = Array.from(new Set([...list, ...relevantSynonyms]));
    return unique.map(d => d.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).sort();
  }, [category]);

  const suggestions2 = useMemo(() => {
    let list: string[] = [];
    if (category === 'Allopathy + Food') {
      list = [...foodInteractions.map(i => i.food)];
    } else if (category === 'Ayurveda + Allopathy') {
      list = [...ayurvedaInteractions.map(i => i.medicine1), ...ayurvedaInteractions.map(i => i.medicine2)];
    } else {
      list = [...drugInteractions.map(i => i.drug1), ...drugInteractions.map(i => i.drug2)];
    }
    const validTargets = new Set(list.map(i => i.toLowerCase()));
    const relevantSynonyms = Object.entries(synonymsMap)
      .filter(([k, v]) => validTargets.has(v.toLowerCase()))
      .map(([k, v]) => k);
      
    const unique = Array.from(new Set([...list, ...relevantSynonyms]));
    return unique.map(d => d.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).sort();
  }, [category]);

  const filteredMed1 = useMemo(() => {
    if (!med1) return suggestions1.slice(0, 5);
    return suggestions1.filter(d => d.toLowerCase().includes(med1.toLowerCase()) && d.toLowerCase() !== med1.toLowerCase()).slice(0, 5);
  }, [med1, suggestions1]);

  const filteredMed2 = useMemo(() => {
    if (!med2) return suggestions2.slice(0, 5);
    return suggestions2.filter(d => d.toLowerCase().includes(med2.toLowerCase()) && d.toLowerCase() !== med2.toLowerCase()).slice(0, 5);
  }, [med2, suggestions2]);

  const translateText = async (text: string, targetLang: string) => {
    if (targetLang === 'en') return text;
    const cacheKey = `${text}-${targetLang}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    const prompt = `Translate the following medical information into ${targetLang === 'hi' ? 'Hindi' : 'Marathi'}. Keep it simple and safe for patients:\n\n${text}`;
    
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: [], userMessageText: prompt })
    });
    
    if (!response.ok) return text;
    const data = await response.json();
    const translated = data.text.trim();
    setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }));
    return translated;
  };

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    if (lang === 'en') {
      setTranslatedResult(null);
      return;
    }
    if (!result) return;

    const translated = {
      status: await translateText(result.status, lang),
      severity: result.severity,
      explanation: await translateText(result.explanation, lang),
      recommendation: await translateText(result.recommendation, lang),
      alternative: result.alternative ? await translateText(result.alternative, lang) : undefined,
    };
    setTranslatedResult(translated);
  };

  const categories = [
    { id: 'ayurveda', title: 'Ayurveda + Allopathy', icon: <Leaf className="text-brand-pink" />, desc: 'Check interactions between traditional herbs and modern medicine.' },
    { id: 'food', title: 'Allopathy + Food', icon: <Apple className="text-brand-blue" />, desc: 'See how your diet affects your medication safety.' },
    { id: 'drug', title: 'Modern Drug + Drug', icon: <Pill className="text-brand-purple" />, desc: 'Verify safety between multiple modern prescriptions.' },
  ];

  const handleCheckSafety = async () => {
    if (!med1 || !med2) return;
    setLoading(true);
    
    // Simulate instant response
    await new Promise(resolve => setTimeout(resolve, 300));

    let d1 = med1.toLowerCase().trim();
    let d2 = med2.toLowerCase().trim();
    
    // Normalize synonyms
    d1 = synonymsMap[d1] || d1;
    d2 = synonymsMap[d2] || d2;

    let match = null;

    if (category === 'Ayurveda + Allopathy' || category === 'Allopathy + Food') {
      match = ayurvedaInteractions.find(i => 
        (i.medicine1.toLowerCase() === d1 && i.medicine2.toLowerCase() === d2) ||
        (i.medicine1.toLowerCase() === d2 && i.medicine2.toLowerCase() === d1)
      );
      
      if (!match) {
        match = foodInteractions.find(i => 
          (i.medicine.toLowerCase() === d1 && i.food.toLowerCase() === d2) ||
          (i.medicine.toLowerCase() === d2 && i.food.toLowerCase() === d1)
        );
      }
    }

    if (!match) {
      match = drugInteractions.find(i => 
        (i.drug1.toLowerCase() === d1 && i.drug2.toLowerCase() === d2) ||
        (i.drug1.toLowerCase() === d2 && i.drug2.toLowerCase() === d1)
      );
    }

    if (match) {
      setResult({
        status: match.status || "Interaction Found",
        severity: match.severity,
        explanation: match.explanation || match.description,
        recommendation: match.recommendation || match.solution,
        alternative: match.alternative,
        emergencySymptoms: match.emergency || match.emergencySymptoms || []
      });
      setTranslatedResult(null);
      setLanguage('en');
    } else {
      setResult({
        status: "No Major Risk Found",
        severity: "Low",
        explanation: "No known major interaction found between these items in our database.",
        recommendation: "Always consult your doctor or pharmacist before combining medications.",
        emergencySymptoms: []
      });
      setTranslatedResult(null);
      setLanguage('en');
    }
    setStep(3);
    setLoading(false);
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
        <h2 className="text-3xl font-bold">Drug Interaction Checker</h2>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => { setCategory(cat.title); setStep(2); }}
              className="glass p-8 rounded-[40px] border border-white/5 group cursor-pointer relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-all">
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{cat.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{cat.desc}</p>
            </motion.div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="glass p-10 rounded-[40px] border border-white/10 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center">{category}</h3>
          <div className="space-y-6">
            <div className="relative">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">Medicine 1 (Required)</label>
              <input 
                value={med1}
                onChange={(e) => { setMed1(e.target.value); setShowSuggestions1(true); }}
                onFocus={() => setShowSuggestions1(true)}
                onBlur={() => setTimeout(() => setShowSuggestions1(false), 200)}
                placeholder="e.g. Ashwagandha or Aspirin"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all"
              />
              {showSuggestions1 && filteredMed1.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl border border-white/10 overflow-hidden z-50">
                  {filteredMed1.map(s => (
                    <button 
                      key={s}
                      onClick={() => { setMed1(s); setShowSuggestions1(false); }}
                      className="w-full px-6 py-3 text-left hover:bg-white/5 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">Medicine 2 (Required)</label>
              <input 
                value={med2}
                onChange={(e) => { setMed2(e.target.value); setShowSuggestions2(true); }}
                onFocus={() => setShowSuggestions2(true)}
                onBlur={() => setTimeout(() => setShowSuggestions2(false), 200)}
                placeholder="e.g. Thyronorm or Ibuprofen"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all"
              />
              {showSuggestions2 && filteredMed2.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl border border-white/10 overflow-hidden z-50">
                  {filteredMed2.map(s => (
                    <button 
                      key={s}
                      onClick={() => { setMed2(s); setShowSuggestions2(false); }}
                      className="w-full px-6 py-3 text-left hover:bg-white/5 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">Optional: Food / Herb / Home Remedy</label>
              <div className="relative">
                <input 
                  value={optional}
                  onChange={(e) => setOptional(e.target.value)}
                  placeholder="e.g. Grapefruit juice"
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all pr-14"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-brand-blue transition-colors">
                  <Mic size={20} />
                </button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckSafety}
              disabled={loading || !med1 || !med2}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-bold text-lg shadow-neon-blue disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={22} />
                  Check Safety
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`glass p-10 rounded-[40px] border-2 ${
            result.severity === 'High' ? 'border-red-500/30' : 
            result.severity === 'Moderate' ? 'border-yellow-500/30' : 'border-green-500/30'
          } relative overflow-hidden`}>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold mb-2">{translatedResult?.status || result.status}</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                    result.severity === 'High' ? 'bg-red-500/20 text-red-500' : 
                    result.severity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                  }`}>
                    <AlertCircle size={14} />
                    {result.severity} Severity
                  </span>
                </div>
              </div>
              <select 
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-white/10 text-white text-xs rounded-full px-3 py-1 border border-white/20 outline-none"
              >
                <option value="en">English (EN)</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                result.severity === 'High' ? 'bg-red-500/10 text-red-500' : 
                result.severity === 'Moderate' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
              }`}>
                {result.severity === 'High' ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Explanation</h4>
                <p className="text-lg text-white/80 leading-relaxed">{translatedResult?.explanation || result.explanation}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Recommendation</h4>
                <div className="flex items-center gap-3 text-xl font-bold text-brand-blue">
                  <Info size={20} />
                  {translatedResult?.recommendation || result.recommendation}
                </div>
              </div>
              {(translatedResult?.alternative || result.alternative) && (
                <div>
                  <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Safe Alternative</h4>
                  <div className="flex items-center gap-3 text-xl font-bold text-green-400">
                    <Leaf size={20} />
                    {translatedResult?.alternative || result.alternative}
                  </div>
                </div>
              )}
              {result.emergencySymptoms && result.emergencySymptoms.length > 0 && (
                <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                  <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-3">Emergency Symptoms</h4>
                  <ul className="grid grid-cols-2 gap-3">
                    {result.emergencySymptoms.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-white/60 text-sm">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] text-center">
                Disclaimer: This is AI-generated guidance. Always consult a doctor.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              onClick={() => onAskAI(`Tell me more about the interaction between ${med1} and ${med2}`)}
              className="px-8 py-3 rounded-2xl glass border border-white/10 flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-all"
            >
              <Bot size={18} className="text-brand-purple" />
              Ask AI More
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} className="px-8 py-3 rounded-2xl glass border border-white/10 flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-all">
              <Stethoscope size={18} className="text-brand-blue" />
              Find Doctor
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} className="px-8 py-3 rounded-2xl glass border border-white/10 flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-all">
              <ShoppingBag size={18} className="text-brand-pink" />
              Find Pharmacy
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} className="px-8 py-3 rounded-2xl glass border border-white/10 flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-all">
              <Save size={18} className="text-brand-blue" />
              Save Result
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} className="px-8 py-3 rounded-2xl glass border border-white/10 flex items-center gap-2 text-sm font-bold hover:bg-white/5 transition-all">
              <Share2 size={18} className="text-brand-purple" />
              Share Result
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const UserDashboard: React.FC<UserDashboardProps> = ({ onLogout, t }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [consultationDoctor, setConsultationDoctor] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load chat sessions
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatSessions(sessions);
    });

    return () => unsubscribe();
  }, []);

  // Load current chat messages
  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      return;
    }

    // Use a flag to prevent snapshot from overwriting local updates during an active turn
    let isInitialLoad = true;
    const unsubscribe = onSnapshot(doc(db, 'chatSessions', currentChatId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Only update messages from Firestore if it's the initial load or if we're not in the middle of a turn
        // This prevents the "instant" UI from being flickered by Firestore's eventual consistency
        setMessages(data.messages || []);
      }
    });

    return () => unsubscribe();
  }, [currentChatId]);

  const createNewChat = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Clear UI immediately
    setCurrentChatId(null);
    setMessages([]);
    setInputText('');

    try {
      const newChatRef = doc(collection(db, 'chatSessions'));
      await setDoc(newChatRef, {
        userId: user.uid,
        chatId: newChatRef.id,
        title: 'New Chat',
        messages: [],
        createdAt: serverTimestamp()
      });
      setCurrentChatId(newChatRef.id);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteDoc(doc(db, 'chatSessions', chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setActiveSection('dashboard');
        setMessages([]);
      }
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  const handleSendMessage = async (overrideText?: any) => {
    const user = auth.currentUser;
    
    // Fix [object Object] bug: extract text if input is an object
    const rawInput = overrideText || inputText || '';
    const textToUse = typeof rawInput === 'object' ? (rawInput.text || JSON.stringify(rawInput)) : String(rawInput);
    
    if (!textToUse.trim() || isTyping || !user) return;

    const userMessageText = textToUse.trim();
    if (!overrideText) setInputText('');
    
    // Step 1: Immediately display user message in UI
    const newUserMessage: Message = {
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    let chatId = currentChatId;
    
    try {
      // Step 2: Call AI response function directly
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [...history, { role: 'user', parts: [{ text: userMessageText }] }],
        config: {
          systemInstruction: `You are a professional healthcare assistant.
You must understand and respond in the user's language.

Supported languages:
- English
- Hindi
- Marathi

If user speaks Hindi or Marathi:
- Respond in the same language
- Use simple, natural, conversational tone

Always:
- Give safe medical advice
- Avoid dangerous suggestions
- Suggest consulting doctor when needed

If input is mixed language:
- Detect dominant language and respond accordingly`
        }
      });
      
      const aiResponseText = typeof response.text === 'string' ? response.text : 
                             (response.text ? JSON.stringify(response.text) : "Unable to fetch response. Please try again.");
      
      // Step 3: Display AI response in UI
      const newAiMessage: Message = {
        sender: 'bot',
        text: aiResponseText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newAiMessage]);

      // Step 4: Save both user + AI messages to Firestore
      if (!chatId) {
        // Create new chat session if it doesn't exist
        const newChatRef = doc(collection(db, 'chatSessions'));
        chatId = newChatRef.id;
        await setDoc(newChatRef, {
          userId: user.uid,
          chatId: chatId,
          title: userMessageText.substring(0, 30) + (userMessageText.length > 30 ? '...' : ''),
          messages: [newUserMessage, newAiMessage],
          createdAt: serverTimestamp()
        });
        setCurrentChatId(chatId);
      } else {
        // Update existing chat
        await updateDoc(doc(db, 'chatSessions', chatId), {
          messages: arrayUnion(newUserMessage, newAiMessage)
        });
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorText = "Unable to fetch response. Please try again.";
      
      // Check for quota exceeded error (429)
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429')) {
        errorText = "The AI Assistant is currently experiencing high demand (Quota Exceeded). Please wait a moment and try again.";
      }

      const errorMessage: Message = {
        text: errorText,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Optionally save the error message to Firestore if chatId exists
      if (chatId) {
        try {
          await updateDoc(doc(db, 'chatSessions', chatId), {
            messages: arrayUnion(newUserMessage, errorMessage)
          });
        } catch (fsError) {
          console.error("Firestore save error:", fsError);
        }
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white flex overflow-hidden font-sans selection:bg-brand-blue/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-purple/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-blue/10 blur-[150px] rounded-full" />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-brand-pink/5 blur-[120px] rounded-full" />
        
        {/* Particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.2} />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/5 flex flex-col relative z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center shadow-neon-blue">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink">
            Dr Drug
          </span>
        </div>

        <div className="px-6 mb-4">
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(6, 182, 212, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewChat}
            className="w-full py-3.5 px-6 glass rounded-2xl border border-white/10 flex items-center justify-center gap-3 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/10 via-brand-purple/10 to-brand-pink/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus size={18} className="text-brand-blue group-hover:drop-shadow-neon-blue transition-all" />
            <span className="text-sm font-bold tracking-wide text-white/80 group-hover:text-white transition-colors">New Chat</span>
            {/* Gradient Border Overlay */}
            <div className="absolute inset-0 rounded-2xl border border-white/5 group-hover:border-brand-blue/30 transition-colors pointer-events-none" />
          </motion.button>
        </div>

        <nav className="flex-1 mt-2 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={<LayoutDashboard size={22} />} 
            label="Dashboard" 
            active={!currentChatId && activeSection === 'dashboard'} 
            onClick={() => {
              setCurrentChatId(null);
              setActiveSection('dashboard');
            }}
          />
          
          {/* Chat History */}
          {chatSessions.length > 0 && (
            <>
              <div className="mt-6 px-6 mb-2">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Recent Chats</span>
              </div>
              <div className="flex flex-col">
                {chatSessions.map((session) => (
                  <SidebarItem 
                    key={session.id} 
                    icon={<MessageSquare size={20} />} 
                    label={session.title || 'Untitled Chat'} 
                    active={currentChatId === session.id}
                    onClick={() => {
                      setCurrentChatId(session.id);
                      setActiveSection('chat');
                    }}
                    onDelete={() => setDeleteConfirmId(session.id)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="mt-6">
            <SidebarItem 
              icon={<HeartPulse size={22} />} 
              label="Suvidha" 
              active={!currentChatId && activeSection === 'suvidha'}
              onClick={() => {
                setCurrentChatId(null);
                setActiveSection('suvidha');
              }}
            />
            <SidebarItem 
              icon={<Pill size={22} />} 
              label="Drug Checker" 
              active={!currentChatId && activeSection === 'checker'}
              onClick={() => {
                setCurrentChatId(null);
                setActiveSection('checker');
              }}
            />
            <SidebarItem 
              icon={<Database size={22} />} 
              label="Generic Medicine" 
              active={!currentChatId && activeSection === 'genericSearch'}
              onClick={() => {
                setCurrentChatId(null);
                setActiveSection('genericSearch');
              }}
            />
            <SidebarItem 
              icon={<Scan size={22} />} 
              label="Prescription Scanner" 
              active={!currentChatId && activeSection === 'prescriptionScanner'}
              onClick={() => {
                setCurrentChatId(null);
                setActiveSection('prescriptionScanner');
              }}
            />
            <SidebarItem icon={<Stethoscope size={22} />} label="Doctor Connect" />
            <SidebarItem icon={<ShoppingBag size={22} />} label="Medicine Services" />
            <SidebarItem icon={<UserRound size={22} />} label="Profile" />
            <SidebarItem icon={<Settings size={22} />} label="Settings" />
            <SidebarItem 
              icon={<LogOut size={22} />} 
              label="Logout" 
              onClick={onLogout}
            />
          </div>
        </nav>

        <div className="p-8 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            className="w-full py-3 px-4 glass border border-white/5 rounded-xl flex items-center gap-3 text-xs font-bold text-white/60 hover:text-white transition-all"
          >
            <Apple size={16} className="text-brand-blue" />
            Download iOS app
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            className="w-full py-3 px-4 glass border border-white/5 rounded-xl flex items-center gap-3 text-xs font-bold text-white/60 hover:text-white transition-all"
          >
            <Smartphone size={16} className="text-brand-purple" />
            Download Android app
          </motion.button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Top Navbar */}
        <header className="px-10 py-6 flex items-center justify-between border-b border-white/5 glass">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Search"
              className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20 text-sm"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2.5 rounded-xl glass hover:bg-white/10 text-white/40 hover:text-white transition-all relative">
              <Mail size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-pink rounded-full shadow-neon-pink" />
            </button>
            <button className="p-2.5 rounded-xl glass hover:bg-white/10 text-white/40 hover:text-white transition-all">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-brand-blue/30 shadow-neon-blue">
                <img 
                  src="https://picsum.photos/seed/user/100/100" 
                  alt="User" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <ChevronDown size={16} className="text-white/20" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto px-10 py-12 flex flex-col items-center relative" ref={scrollRef}>
          
          <AnimatePresence mode="wait">
            {!currentChatId && activeSection === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center w-full"
              >
                {/* Center Icon Orb */}
                <div className="relative mb-12">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 40px rgba(139, 92, 246, 0.3)",
                        "0 0 70px rgba(6, 182, 212, 0.5)",
                        "0 0 40px rgba(139, 92, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-blue via-brand-purple to-brand-pink p-[2px] flex items-center justify-center relative z-10"
                  >
                    <div className="w-full h-full rounded-full bg-[#030305] flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 via-brand-purple/20 to-brand-pink/20 blur-xl" />
                      <Plus size={48} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                    </div>
                  </motion.div>
                  {/* Background Glows for Orb */}
                  <div className="absolute inset-0 bg-brand-blue/20 blur-3xl rounded-full -z-10 animate-pulse" />
                </div>

                <h1 className="text-5xl font-bold mb-8 tracking-tight text-center">
                  Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink">Dr Drug AI Assistant</span>
                </h1>

                {/* Feature Carousel */}
                <FeatureCarousel onFeatureClick={(label) => setInputText(label)} />

                {/* Suggested Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
                  {["Check drug interaction", "Scan prescription", "Consult with a doctor"].map((action, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.5)" }}
                      onClick={() => {
                        setInputText(action);
                      }}
                      className="px-6 py-2.5 rounded-full glass border border-white/10 text-sm font-medium text-white/60 hover:text-white transition-all hover:shadow-neon-blue"
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {!currentChatId && activeSection === 'suvidha' && (
              <SuvidhaView key="suvidha" onFeatureClick={(label) => {
                if (label === 'checker') setActiveSection('checker');
                else if (label === 'drugSearch') setActiveSection('drugSearch');
                else if (label === 'genericSearch') setActiveSection('genericSearch');
                else if (label === 'prescriptionScanner') setActiveSection('prescriptionScanner');
                else if (label === 'homeRemedies') setActiveSection('homeRemedies');
                else if (label === 'storeLocator') setActiveSection('storeLocator');
                else if (label === 'nearbyDoctors') setActiveSection('nearbyDoctors');
                else if (label === 'doctorConsultation') setActiveSection('doctorConsultation');
                else setInputText(label);
              }} />
            )}

            {!currentChatId && activeSection === 'checker' && (
              <InteractionChecker 
                key="checker" 
                onBack={() => setActiveSection('suvidha')} 
                onAskAI={(query) => {
                  handleSendMessage(query);
                }}
              />
            )}

            {!currentChatId && activeSection === 'drugSearch' && (
              <DrugSearch 
                key="drugSearch" 
                onBack={() => setActiveSection('suvidha')} 
              />
            )}

            {!currentChatId && activeSection === 'genericSearch' && (
              <GenericMedicineSearch 
                key="genericSearch" 
              />
            )}

            {!currentChatId && activeSection === 'prescriptionScanner' && (
              <AIPrescriptionScanner 
                key="prescriptionScanner" 
                onBack={() => setActiveSection('suvidha')} 
              />
            )}

            {!currentChatId && activeSection === 'homeRemedies' && (
              <HomeRemedies 
                key="homeRemedies" 
                onBack={() => setActiveSection('suvidha')} 
                onAskAI={(query) => {
                  handleSendMessage(query);
                }}
              />
            )}

            {!currentChatId && activeSection === 'storeLocator' && (
              <MedicineStoreLocator 
                key="storeLocator" 
                onBack={() => setActiveSection('suvidha')} 
              />
            )}

            {!currentChatId && activeSection === 'nearbyDoctors' && (
              <NearbyDoctors 
                key="nearbyDoctors" 
                onBack={() => setActiveSection('suvidha')} 
                onBookConsultation={(doc) => {
                  setConsultationDoctor(doc);
                  setActiveSection('doctorConsultation');
                }}
              />
            )}

            {!currentChatId && activeSection === 'doctorConsultation' && (
              <DoctorConsultation 
                key="doctorConsultation" 
                onBack={() => {
                  setActiveSection('suvidha');
                  setConsultationDoctor(null);
                }} 
                initialDoctor={consultationDoctor}
              />
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          {currentChatId && (
            <div className="w-full max-w-4xl flex-1 flex flex-col gap-6 mb-8">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-brand-blue/20 text-brand-blue' : 'bg-brand-purple/20 text-brand-purple'
                  }`}>
                    {msg.sender === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`glass px-6 py-4 rounded-3xl max-w-[80%] border border-white/5 ${
                    msg.sender === 'user' ? 'rounded-tr-none bg-brand-blue/5' : 'rounded-tl-none bg-brand-purple/5'
                  }`}>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-purple/20 text-brand-purple flex items-center justify-center shrink-0">
                    <Bot size={20} />
                  </div>
                  <div className="glass px-6 py-4 rounded-3xl rounded-tl-none bg-brand-purple/5 border border-white/5 flex items-center gap-1">
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-brand-purple rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-purple rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-purple rounded-full" />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Input Section */}
          <AnimatePresence>
            {activeSection !== 'suvidha' && activeSection !== 'genericSearch' && activeSection !== 'prescriptionScanner' && activeSection !== 'homeRemedies' && activeSection !== 'storeLocator' && activeSection !== 'doctorConsultation' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-3xl sticky bottom-0 pb-4 mt-auto"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue/20 via-brand-purple/20 to-brand-pink/20 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="glass p-6 rounded-[32px] border border-white/10 relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Ask anything about medicines or health..."
                        className="flex-1 bg-transparent border-none outline-none resize-none h-12 text-lg placeholder:text-white/20 text-white/80"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSendMessage}
                        disabled={isTyping}
                        className={`w-12 h-12 bg-gradient-to-r from-brand-blue to-brand-purple rounded-2xl text-white shadow-neon-blue flex items-center justify-center group/send ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </motion.button>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl glass border border-white/5 text-xs font-bold text-white/40 hover:text-white transition-all group/btn"
                      >
                        <Mic size={16} className="text-brand-blue group-hover/btn:drop-shadow-neon-blue" />
                        Voice Input
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={handleSendMessage}
                        disabled={isTyping}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-blue text-xs font-bold text-white shadow-neon-purple ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Search size={16} />
                        Search
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-2xl glass border border-white/5 text-xs font-bold text-white/40 hover:text-white transition-all group/btn"
                      >
                        <Upload size={16} className="text-brand-pink group-hover/btn:drop-shadow-neon-pink" />
                        Upload Prescription
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-8 rounded-[32px] border border-white/10 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="text-red-500 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-2">Delete Chat?</h3>
              <p className="text-white/40 text-center mb-8">Are you sure you want to delete this chat? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3.5 rounded-2xl glass border border-white/5 font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteChat(deleteConfirmId)}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboard;
