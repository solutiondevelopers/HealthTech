import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  Search, 
  MessageSquare, 
  Stethoscope, 
  Bell, 
  MapPin, 
  Leaf, 
  Pill, 
  ChevronRight, 
  Menu, 
  X,
  Github,
  Twitter,
  Linkedin,
  Facebook,
  User,
  Scan,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import RoleSelection from './components/RoleSelection';
import UserRegistration from './components/UserRegistration';
import DoctorRegistration from './components/DoctorRegistration';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import LanguageSelector from './components/LanguageSelector';
import { Language, translations } from './utils/translations';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

// --- Hooks ---

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mousePosition;
};

// --- Components ---

const FloatingMedicine = ({ x: initialX, y: initialY, color, delay = 0 }: { x: string, y: string, color: string, delay?: number }) => {
  const mouse = useMousePosition();
  const elementRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = mouse.x - centerX;
    const dy = mouse.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 300) {
      const power = (300 - distance) / 300;
      setOffset({
        x: -dx * power * 0.3,
        // Add a bit of the floating motion to the y offset too
        y: -dy * power * 0.3
      });
      setIsNear(true);
    } else {
      setOffset({ x: 0, y: 0 });
      setIsNear(false);
    }
  }, [mouse]);

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0.3 }}
      animate={{
        x: offset.x,
        y: [offset.y, offset.y - 20, offset.y],
        opacity: isNear ? 0.7 : [0.3, 0.5, 0.3],
        scale: isNear ? 1.4 : 1,
      }}
      transition={{
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
        opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay },
        x: { type: "spring", stiffness: 40, damping: 20 },
        scale: { type: "spring", stiffness: 80, damping: 12 }
      }}
      style={{ left: initialX, top: initialY }}
      className="absolute pointer-events-none z-0 hidden lg:block"
    >
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center glass border-2"
        style={{ 
          boxShadow: `0 0 30px ${color}${isNear ? 'AA' : '55'}`,
          borderColor: `${color}${isNear ? '88' : '44'}`
        }}
      >
        <Pill className="w-7 h-7" style={{ color }} />
      </div>
    </motion.div>
  );
};

const Navbar = ({ theme, toggleTheme, onLoginClick, language, onLanguageChange }: { 
  theme: string, 
  toggleTheme: () => void, 
  onLoginClick: () => void,
  language: Language,
  onLanguageChange: (lang: Language) => void
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[var(--bg-color)]/80 backdrop-blur-md py-4 border-b border-[var(--glass-border)]' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center shadow-neon-purple">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-color)] to-[var(--text-color)]/70">
            Dr Drug
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-[var(--text-color)]/70 hover:text-[var(--text-color)] transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full glass glass-hover text-[var(--text-color)]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={onLoginClick}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-purple to-brand-blue rounded-full text-sm font-semibold shadow-neon-purple hover:scale-105 transition-transform active:scale-95 text-white"
          >
            Login
          </button>
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full glass text-[var(--text-color)]"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="text-[var(--text-color)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[var(--bg-color)] border-b border-[var(--glass-border)] p-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-lg font-medium text-[var(--text-color)]/70"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="w-full py-3 bg-gradient-to-r from-brand-purple to-brand-blue rounded-xl text-sm font-semibold mt-4 text-white"
              >
                Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FloatingDevice = ({ className, color, delay = 0, duration = 5 }: { className: string, color: string, delay?: number, duration?: number }) => {
  return (
    <motion.div
      initial={{ y: 0, opacity: 0.1 }}
      animate={{ 
        y: [0, -20, 0],
        opacity: [0.1, 0.2, 0.1],
        boxShadow: [
          `0 0 15px ${color}22`,
          `0 0 35px ${color}44`,
          `0 0 15px ${color}22`
        ]
      }}
      transition={{ 
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
      className={`absolute hidden lg:block w-28 h-48 glass rounded-[2rem] border-[var(--glass-border)] blur-[1px] pointer-events-none z-0 ${className}`}
    >
      <div className="w-8 h-1 bg-[var(--text-color)]/20 rounded-full mx-auto mt-4" />
      <div className="mt-8 mx-4 h-1.5 bg-[var(--text-color)]/10 rounded" />
      <div className="mt-3 mx-4 h-1.5 bg-[var(--text-color)]/10 rounded w-2/3" />
      <div className="mt-10 mx-4 aspect-[4/3] bg-[var(--text-color)]/5 rounded-lg flex items-center justify-center">
        <Activity className="w-6 h-6 opacity-10" />
      </div>
    </motion.div>
  );
};

const Hero = ({ onSignUp }: { onSignUp: () => void }) => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/20 blur-[120px] rounded-full" />
      
      {/* Floating Devices Background Elements */}
      <FloatingDevice className="top-20 left-[5%] rotate-[-15deg]" color="#8b5cf6" delay={0} duration={6} />
      <FloatingDevice className="top-40 right-[8%] rotate-[12deg]" color="#06b6d4" delay={1} duration={5} />
      <FloatingDevice className="bottom-10 left-[12%] rotate-[8deg]" color="#ec4899" delay={2} duration={7} />
      <FloatingDevice className="bottom-20 right-[15%] rotate-[-10deg]" color="#8b5cf6" delay={0.5} duration={5.5} />
      <FloatingDevice className="top-1/2 left-[2%] -translate-y-1/2 rotate-[5deg]" color="#06b6d4" delay={1.5} duration={6.5} />

      {/* Interactive Medicine Elements */}
      <FloatingMedicine x="15%" y="25%" color="#8b5cf6" delay={0} />
      <FloatingMedicine x="80%" y="15%" color="#06b6d4" delay={1} />
      <FloatingMedicine x="10%" y="70%" color="#ec4899" delay={2} />
      <FloatingMedicine x="85%" y="65%" color="#8b5cf6" delay={0.5} />
      <FloatingMedicine x="25%" y="80%" color="#06b6d4" delay={1.5} />
      <FloatingMedicine x="70%" y="85%" color="#ec4899" delay={0.8} />
      <FloatingMedicine x="45%" y="10%" color="#8b5cf6" delay={1.2} />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-[var(--text-color)]">
            AI-Powered Medication <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink">
              Safety Platform
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-color)]/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Boost efficiency with our all-in-one multi-system medical guidance. Identify drug interactions, scan prescriptions, and access real-time AI health insights.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onSignUp}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue rounded-full text-lg font-bold shadow-neon-purple hover:scale-105 transition-transform active:scale-95 text-white"
            >
              Try Now
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-full text-lg font-bold hover:bg-[var(--glass-bg)]/20 transition-colors active:scale-95 text-[var(--text-color)]">
              Learn More
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const MainFeatures = () => {
  const features = [
    {
      title: "Drug Interaction Checker",
      desc: "Check for potential drug-drug and drug-disease interactions to prevent adverse effects.",
      icon: <Pill className="w-8 h-8 text-brand-blue" />,
      color: "blue"
    },
    {
      title: "AI Prescription Scanner",
      desc: "Instantly scan and analyze prescriptions with AI for accurate identification and digitization.",
      icon: <Scan className="w-8 h-8 text-brand-purple" />,
      color: "purple",
      highlight: true
    },
    {
      title: "AI Health Assistant",
      desc: "Get personalised health guidance, manage tasks, and communicate with healthcare professionals.",
      icon: <MessageSquare className="w-8 h-8 text-brand-pink" />,
      color: "pink"
    }
  ];

  return (
    <section id="features" className="py-20 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className={`glass p-8 rounded-[32px] relative group ${f.highlight ? 'md:scale-110 z-10 border-brand-purple/30 shadow-neon-purple' : 'glass-hover'}`}
          >
            <div className="mb-6 w-16 h-16 rounded-2xl bg-[var(--text-color)]/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            
            {f.highlight && (
              <div className="mb-8 relative aspect-[9/16] max-w-[200px] mx-auto bg-[var(--card-bg)] rounded-[2rem] border-4 border-[var(--glass-border)] overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/20 to-transparent" />
                <div className="p-4 h-full flex flex-col">
                  <div className="w-12 h-1 bg-[var(--text-color)]/20 rounded-full mx-auto mb-4" />
                  <div className="flex-1 border-2 border-dashed border-brand-purple/40 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <Scan className="w-10 h-10 text-brand-purple mx-auto mb-2 animate-pulse" />
                      <div className="text-[10px] text-[var(--text-color)]/40 uppercase tracking-widest">Scanning...</div>
                    </div>
                  </div>
                  <div className="mt-4 h-12 bg-brand-purple/20 rounded-lg" />
                </div>
              </div>
            )}

            <h3 className="text-2xl font-bold mb-4 text-[var(--text-color)]">{f.title}</h3>
            <p className="text-[var(--text-color)]/50 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const TrustBanner = () => {
  const items = [
    { icon: <User className="w-5 h-5" />, title: "3 User Roles", desc: "Patient, Doctor, Pharmacist" },
    { icon: <Smartphone className="w-5 h-5" />, title: "Multi-System Support", desc: "Web, iOS, Android" },
    { icon: <Activity className="w-5 h-5" />, title: "Real-Time AI Analysis", desc: "Instant health insights" },
    { icon: <ShieldCheck className="w-5 h-5" />, title: "Secure & Scalable", desc: "Enterprise-grade security" }
  ];

  return (
    <section className="py-12 px-6">
      <div className="max-w-7xl mx-auto glass rounded-[2rem] p-8 md:p-12">
        <h2 className="text-center text-xl font-semibold mb-10 text-[var(--text-color)]/80">Trusted by Healthcare Professionals</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left">
              <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple">
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1 text-[var(--text-color)]">{item.title}</h4>
                <p className="text-xs text-[var(--text-color)]/40">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureGrid = () => {
  const features = [
    { title: "Interaction Checker", icon: <Pill className="text-brand-purple" /> },
    { title: "Scanner", icon: <Scan className="text-brand-blue" /> },
    { title: "AI Assistant", icon: <MessageSquare className="text-brand-pink" /> },
    { title: "Health Detect", icon: <Activity className="text-brand-purple" /> },
    { title: "Home Remedies", icon: <Leaf className="text-brand-blue" /> },
    { title: "Nearby Doctors", icon: <MapPin className="text-brand-pink" /> },
    { title: "Notifications", icon: <Bell className="text-brand-purple" /> },
    { title: "Generic Meds", icon: <Search className="text-brand-blue" /> },
  ];

  return (
    <section className="py-20 max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold mb-16 text-[var(--text-color)]">Feature Grid</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="glass p-6 rounded-2xl glass-hover flex flex-col items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--text-color)]/5 flex items-center justify-center">
              {f.icon}
            </div>
            <span className="text-sm font-semibold text-[var(--text-color)]/80">{f.title}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    { title: "Enter/Scan", desc: "Input meds or scan prescription", icon: <Smartphone /> },
    { title: "AI Analysis", desc: "Our AI processes the data", icon: <Zap /> },
    { title: "Review Insights", desc: "Get detailed safety reports", icon: <Search /> },
    { title: "Take Action", desc: "Follow AI-guided steps", icon: <ChevronRight /> },
  ];

  return (
    <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold mb-16 text-[var(--text-color)]">How it Works</h2>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
        {/* Connector Line */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple/20 via-brand-blue/20 to-brand-purple/20 -translate-y-1/2 z-0" />
        
        {steps.map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-6 w-full md:w-1/4">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-color)] border-2 border-brand-purple/30 flex items-center justify-center text-brand-purple shadow-neon-purple">
              {step.icon}
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2 text-[var(--text-color)]">{i + 1}. {step.title}</h4>
              <p className="text-sm text-[var(--text-color)]/50">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const UserRoles = () => {
  const roles = [
    { title: "Patient", desc: "Manage medications, access records, and consult AI instantly.", icon: <User className="text-brand-purple" /> },
    { title: "Doctor", desc: "Review patient profiles, analyze interactions, and track progress.", icon: <Stethoscope className="text-brand-blue" /> },
    { title: "Pharmacist", desc: "Verify prescriptions, identify risks, and ensure patient safety.", icon: <Activity className="text-brand-pink" /> },
  ];

  return (
    <section className="py-20 max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold mb-16 text-[var(--text-color)]">User Roles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {roles.map((role, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            className="glass p-10 rounded-[2.5rem] glass-hover"
          >
            <div className="w-20 h-20 rounded-3xl bg-[var(--text-color)]/5 flex items-center justify-center mx-auto mb-8">
              <div className="w-12 h-12 text-brand-purple">
                {role.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-[var(--text-color)]">{role.title}</h3>
            <p className="text-[var(--text-color)]/50 leading-relaxed">{role.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="pt-20 pb-10 border-t border-[var(--glass-border)] mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-brand-purple w-8 h-8" />
              <span className="text-2xl font-bold text-[var(--text-color)]">Dr Drug</span>
            </div>
            <p className="text-[var(--text-color)]/40 text-sm leading-relaxed mb-8">
              Empowering healthcare with AI. Our platform ensures medication safety and provides real-time health insights for everyone.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[var(--text-color)]/5 flex items-center justify-center hover:bg-brand-purple transition-colors text-[var(--text-color)]"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-[var(--text-color)]/5 flex items-center justify-center hover:bg-brand-purple transition-colors text-[var(--text-color)]"><Linkedin size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-[var(--text-color)]/5 flex items-center justify-center hover:bg-brand-purple transition-colors text-[var(--text-color)]"><Github size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-[var(--text-color)]/5 flex items-center justify-center hover:bg-brand-purple transition-colors text-[var(--text-color)]"><Facebook size={18} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-[var(--text-color)]">Product</h4>
            <ul className="space-y-4 text-sm text-[var(--text-color)]/50">
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Prescription Scanner</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">AI Assistant</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-[var(--text-color)]">Resources</h4>
            <ul className="space-y-4 text-sm text-[var(--text-color)]/50">
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-[var(--text-color)]">Company</h4>
            <ul className="space-y-4 text-sm text-[var(--text-color)]/50">
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[var(--text-color)] transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="text-center pt-10 border-t border-[var(--glass-border)] text-xs text-[var(--text-color)]/30">
          &copy; {new Date().getFullYear()} Dr Drug. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [view, setView] = useState<'landing' | 'role-selection' | 'user-registration' | 'doctor-registration' | 'login' | 'user-dashboard' | 'doctor-dashboard'>('landing');
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) setLanguage(savedLang);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = translations[language];
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('landing');
    } catch (error) {
      console.error("Error signing out:", error);
      setView('landing'); // Fallback
    }
  };

  if (view === 'role-selection') {
    return (
      <RoleSelection 
        onBack={() => setView('landing')} 
        onContinue={(role) => {
          if (role === 'user') setView('user-registration');
          if (role === 'doctor') setView('doctor-registration');
        }} 
        t={t}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  if (view === 'user-registration') {
    return (
      <UserRegistration 
        onBack={() => setView('role-selection')} 
        onLogin={() => setView('login')}
        onSuccess={() => setView('user-dashboard')}
        t={t} 
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  if (view === 'doctor-registration') {
    return (
      <DoctorRegistration 
        onBack={() => setView('role-selection')} 
        onLogin={() => setView('login')}
        onSuccess={() => setView('doctor-dashboard')}
        t={t} 
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  if (view === 'login') {
    return (
      <Login 
        onBack={() => setView('landing')} 
        onSignUp={() => setView('role-selection')}
        onLoginSuccess={(role) => {
          if (role === 'doctor') {
            setView('doctor-dashboard'); 
          } else {
            setView('user-dashboard');
          }
        }}
        t={t}
        language={language}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  if (view === 'user-dashboard') {
    return (
      <UserDashboard 
        onLogout={handleLogout}
        t={t}
      />
    );
  }

  if (view === 'doctor-dashboard') {
    return (
      <DoctorDashboard 
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen selection:bg-brand-purple/30 selection:text-[var(--text-color)] bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
      <Navbar 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onLoginClick={() => setView('login')} 
        language={language}
        onLanguageChange={handleLanguageChange}
      />
      <main>
        <Hero onSignUp={() => setView('role-selection')} />
        <MainFeatures />
        <TrustBanner />
        <FeatureGrid />
        <HowItWorks />
        <UserRoles />
      </main>
      <Footer />
    </div>
  );
}
