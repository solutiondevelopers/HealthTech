import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Pill, Scan, MessageSquare, ArrowLeft } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { Language } from '../utils/translations';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface UserRegistrationProps {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
  t: any;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const FloatingPill = ({ x, y, color, delay = 0 }: { x: string, y: string, color: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0.2 }}
    animate={{
      y: [0, -30, 0],
      rotate: [0, 10, -10, 0],
      opacity: [0.2, 0.4, 0.2],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    style={{ left: x, top: y }}
    className="absolute pointer-events-none z-0 blur-[2px]"
  >
    <div 
      className="w-12 h-6 rounded-full border-2"
      style={{ 
        borderColor: `${color}44`,
        boxShadow: `0 0 20px ${color}33`,
        background: `linear-gradient(90deg, ${color}22 50%, transparent 50%)`
      }}
    />
  </motion.div>
);

const UserRegistration: React.FC<UserRegistrationProps> = ({ onBack, onLogin, onSuccess, t, language, onLanguageChange }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodGroup: '',
    allergies: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Store in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies,
        role: 'user',
        createdAt: new Date().toISOString()
      });

      localStorage.setItem('userRole', 'user');
      onSuccess();
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setError("Registration is currently disabled. Please enable Email/Password in the Firebase Console.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login instead.");
      } else if (error.code === 'auth/weak-password') {
        setError("Weak password");
      } else {
        setError("Registration failed: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden flex items-center justify-center p-4 md:p-8">
      {/* Language Selector */}
      <div className="absolute top-8 right-8 z-50">
        <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
      </div>

      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-purple/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-blue/10 blur-[150px] rounded-full" />

      {/* Floating Pills */}
      <FloatingPill x="5%" y="15%" color="#8b5cf6" delay={0} />
      <FloatingPill x="85%" y="10%" color="#06b6d4" delay={1} />
      <FloatingPill x="10%" y="80%" color="#ec4899" delay={2} />
      <FloatingPill x="90%" y="70%" color="#8b5cf6" delay={0.5} />

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side - Info */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8"
        >
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
            <div className="w-12 h-12 bg-gradient-to-br from-brand-purple to-brand-blue rounded-2xl flex items-center justify-center shadow-neon-purple group-hover:scale-110 transition-transform">
              <Activity className="text-white w-7 h-7" />
            </div>
            <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink">
              Dr Drug
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              {t.joinFuture.split('Safe Healthcare')[0]} <br />
              <span className="text-brand-blue">{t.safeHealthcare}</span>
            </h1>
            <p className="text-white/50 text-xl max-w-lg leading-relaxed">
              {t.userSubtext}
            </p>
          </div>

          <div className="space-y-6 mt-4">
            {[
              { icon: <Pill className="text-brand-blue" />, text: t.feature1 },
              { icon: <Scan className="text-brand-purple" />, text: t.feature2 },
              { icon: <MessageSquare className="text-brand-pink" />, text: t.feature3 }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center group-hover:shadow-neon-blue transition-all">
                  {item.icon}
                </div>
                <span className="text-lg font-medium text-white/80">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="glass p-8 md:p-10 rounded-[40px] border-brand-purple/20 shadow-2xl relative overflow-hidden">
            {/* Subtle Inner Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-purple/10 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">{t.signUp}</h2>
              <button onClick={onBack} className="p-2 rounded-full glass glass-hover text-white/50 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleRegister}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/40 ml-1">{t.fullName}</label>
                <input 
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  type="text" 
                  placeholder="John Doe"
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/40 ml-1">{t.email}</label>
                <input 
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/40 ml-1">{t.phone}</label>
                <input 
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition-all placeholder:text-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/40 ml-1">{t.password}</label>
                  <input 
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/40 ml-1">{t.confirmPassword}</label>
                  <input 
                    required
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/40 ml-1">{t.bloodGroup}</label>
                  <select 
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 rounded-2xl bg-[#0a0a0c] border border-white/10 focus:border-brand-blue outline-none transition-all text-white/60 appearance-none cursor-pointer"
                  >
                    <option value="">{t.selectGroup}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/40 ml-1">{t.allergies}</label>
                  <input 
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    type="text" 
                    placeholder="e.g. Penicillin"
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3"
                    >
                      <Activity size={18} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(139, 92, 246, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink rounded-full text-lg font-bold shadow-neon-purple text-white ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Creating Account...' : t.createAccount}
                </motion.button>
              </div>

              <p className="text-center text-sm text-white/40 mt-6">
                {t.alreadyAccount} <span onClick={onLogin} className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue font-bold cursor-pointer hover:opacity-80 transition-opacity">{t.login}</span>
              </p>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default UserRegistration;
