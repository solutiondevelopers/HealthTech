import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, CheckCircle2, Brain, Users, ArrowLeft } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { Language } from '../utils/translations';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';

interface LoginProps {
  onBack: () => void;
  onSignUp: () => void;
  onLoginSuccess: (role: string) => void;
  t: any;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const FloatingPill = ({ x, y, color, delay = 0, rotate = 0 }: { x: string, y: string, color: string, delay?: number, rotate?: number }) => (
  <motion.div
    initial={{ opacity: 0.1 }}
    animate={{
      y: [0, -40, 0],
      rotate: [rotate, rotate + 15, rotate - 15, rotate],
      opacity: [0.1, 0.2, 0.1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    style={{ left: x, top: y }}
    className="absolute pointer-events-none z-0 blur-[4px]"
  >
    <div 
      className="w-20 h-10 rounded-full border-2"
      style={{ 
        borderColor: `${color}22`,
        boxShadow: `0 0 30px ${color}11`,
        background: `linear-gradient(90deg, ${color}11 50%, transparent 50%)`
      }}
    />
  </motion.div>
);

const NeonWave = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path
      d="M100 300C200 200 300 400 400 300C500 200 600 400 700 300"
      stroke="url(#neonGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.3 }}
      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    />
    <defs>
      <linearGradient id="neonGradient" x1="100" y1="300" x2="700" y2="300" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06b6d4" />
        <stop offset="0.5" stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

const Login: React.FC<LoginProps> = ({ onBack, onSignUp, onLoginSuccess, t, language, onLanguageChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleRedirect = async (uid: string) => {
    try {
      // Use getDocFromServer to ensure we have a fresh connection and data
      const userDoc = await getDocFromServer(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        localStorage.setItem('userRole', role);
        onLoginSuccess(role);
      } else {
        // Default to user if no doc found (might be first time google login)
        localStorage.setItem('userRole', 'user');
        onLoginSuccess('user');
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      setError("Error fetching user data. Please check your internet connection and try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleRoleRedirect(userCredential.user.uid);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setError("Sign-in provider not enabled. Please enable Email/Password and Google in the Firebase Console.");
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        setError("Login failed: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleRoleRedirect(result.user.uid);
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === 'auth/popup-blocked') {
        setError("Login popup was blocked by your browser. Please allow popups for this site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore this
      } else if (error.code === 'auth/user-cancelled') {
        // User closed the popup
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Google sign-in is not enabled in the Firebase Console.");
      } else {
        setError("Google login failed: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden flex flex-col">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-purple/10 blur-[180px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-blue/10 blur-[180px] rounded-full" />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-brand-pink/5 blur-[150px] rounded-full" />

      {/* Floating Elements */}
      <FloatingPill x="5%" y="15%" color="#8b5cf6" delay={0} rotate={-20} />
      <FloatingPill x="85%" y="10%" color="#06b6d4" delay={1.5} rotate={30} />
      <FloatingPill x="12%" y="75%" color="#ec4899" delay={2.5} rotate={15} />
      <FloatingPill x="92%" y="80%" color="#8b5cf6" delay={0.8} rotate={-10} />

      {/* Navbar */}
      <nav className="relative z-20 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
          <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center shadow-neon-blue">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-brand-blue">Dr</span> Drug
          </span>
        </div>
        <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left Side - Info */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-10"
        >
          <div className="space-y-6">
            <h1 className="text-7xl font-bold leading-tight tracking-tight">
              {t.welcomeBack}
            </h1>
            <p className="text-white/50 text-xl max-w-md leading-relaxed">
              {t.loginSubtext}
            </p>
          </div>

          <div className="space-y-8">
            {[
              { icon: <CheckCircle2 className="text-brand-blue w-6 h-6" />, text: t.featSafety },
              { icon: <Brain className="text-brand-purple w-6 h-6" />, text: t.featInsights },
              { icon: <Users className="text-brand-pink w-6 h-6" />, text: t.featConnect }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-5 group"
              >
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-neon-blue transition-all">
                  {item.icon}
                </div>
                <span className="text-xl font-medium text-white/80">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Card */}
        <div className="relative">
          {/* Neon Waves behind card */}
          <NeonWave className="absolute -top-20 -right-20 w-[120%] h-[120%] pointer-events-none z-0" />
          <NeonWave className="absolute -bottom-20 -left-20 w-[120%] h-[120%] pointer-events-none z-0 rotate-180" />

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10"
          >
            <div className="glass p-10 md:p-12 rounded-[2.5rem] border-2 border-transparent relative overflow-hidden group">
              {/* Neon Border Gradient Effect */}
              <div className="absolute inset-0 rounded-[2.5rem] p-[2px] pointer-events-none">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-brand-blue via-brand-purple to-brand-pink opacity-40 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-[2px] rounded-[2.4rem] bg-[#030305]/90" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold">{t.login}</h2>
                  <button onClick={onBack} className="p-2 rounded-full glass glass-hover text-white/50 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/40 ml-1">{t.email}</label>
                    <input 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/40 ml-1">{t.password}</label>
                    <input 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password" 
                      placeholder="••••••••"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-5 h-5 rounded-md border-2 border-white/10 flex items-center justify-center group-hover:border-brand-blue transition-colors">
                        <input type="checkbox" className="hidden peer" />
                        <div className="w-3 h-3 rounded-sm bg-brand-blue opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-white/60 group-hover:text-white transition-colors">{t.rememberMe}</span>
                    </label>
                    <a href="#" className="text-brand-blue hover:text-brand-blue/80 transition-colors font-medium">{t.forgotPassword}</a>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(6, 182, 212, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-5 bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink rounded-full text-lg font-bold shadow-neon-blue text-white ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Logging in...' : t.login}
                  </motion.button>

                  <div className="relative flex items-center justify-center py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <span className="relative px-4 bg-[#0a0a0c] text-xs font-bold text-white/20 tracking-widest uppercase">{t.or}</span>
                  </div>

                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="font-medium text-white/80 group-hover:text-white transition-colors">{t.continueGoogle}</span>
                  </button>

                  <p className="text-center text-sm text-white/40 mt-6">
                    {t.noAccount} <span onClick={onSignUp} className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue font-bold cursor-pointer hover:opacity-80 transition-opacity">{t.signUp}</span>
                  </p>
                </form>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Login;
