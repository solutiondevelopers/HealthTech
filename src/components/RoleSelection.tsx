import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Stethoscope, Activity } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { Language } from '../utils/translations';

const FloatingMedicine = ({ x: initialX, y: initialY, color, delay = 0 }: { x: string, y: string, color: string, delay?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0.3 }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
        opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay },
      }}
      style={{ left: initialX, top: initialY }}
      className="absolute pointer-events-none z-0 hidden lg:block"
    >
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center glass border-2"
        style={{ 
          boxShadow: `0 0 30px ${color}55`,
          borderColor: `${color}44`
        }}
      >
        <Activity className="w-6 h-6" style={{ color }} />
      </div>
    </motion.div>
  );
};

interface RoleSelectionProps {
  onBack: () => void;
  onContinue: (role: 'user' | 'doctor') => void;
  t: any;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onBack, onContinue, t, language, onLanguageChange }) => {
  const [selectedRole, setSelectedRole] = useState<'user' | 'doctor' | null>(null);

  const roles = [
    {
      id: 'user' as const,
      title: t.normalUser,
      description: t.userDesc,
      icon: <User className="w-16 h-16" />,
      color: '#8b5cf6' // Purple
    },
    {
      id: 'doctor' as const,
      title: t.doctor,
      description: t.doctorDesc,
      icon: <Stethoscope className="w-16 h-16" />,
      color: '#06b6d4' // Blue
    }
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Language Selector */}
      <div className="absolute top-8 right-8 z-50">
        <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
      </div>

      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/20 blur-[120px] rounded-full" />

      {/* Floating Elements */}
      <FloatingMedicine x="10%" y="20%" color="#8b5cf6" delay={0} />
      <FloatingMedicine x="85%" y="15%" color="#06b6d4" delay={1} />
      <FloatingMedicine x="15%" y="75%" color="#ec4899" delay={2} />
      <FloatingMedicine x="80%" y="80%" color="#8b5cf6" delay={0.5} />

      {/* Main Content */}
      <div className="max-w-4xl w-full text-center relative z-10 flex flex-col items-center">
        {/* Header / Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 cursor-pointer mb-8"
          onClick={onBack}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center shadow-neon-purple">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Dr Drug</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-white/50 text-lg mb-12">{t.chooseRole}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRole(role.id)}
              className={`relative p-10 rounded-[2.5rem] cursor-pointer transition-all duration-300 group ${
                selectedRole === role.id 
                ? 'bg-white/10 border-2 border-brand-purple shadow-[0_0_40px_rgba(139,92,246,0.3)]' 
                : 'glass glass-hover'
              }`}
            >
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 transition-all duration-300 ${
                selectedRole === role.id ? 'bg-brand-purple/20' : 'bg-white/5'
              }`}>
                <div style={{ color: selectedRole === role.id ? role.color : 'white' }} className="transition-colors duration-300">
                  {role.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">{role.title}</h3>
              <p className="text-white/40 leading-relaxed text-sm">{role.description}</p>
              
              {/* Glow Border Effect for selected state */}
              {selectedRole === role.id && (
                <div className="absolute inset-0 rounded-[2.5rem] border-2 border-brand-purple animate-pulse pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>

        <motion.button
          disabled={!selectedRole}
          onClick={() => selectedRole && onContinue(selectedRole)}
          whileHover={selectedRole ? { scale: 1.05 } : {}}
          whileTap={selectedRole ? { scale: 0.95 } : {}}
          className={`px-12 py-4 rounded-full text-lg font-bold transition-all duration-300 ${
            selectedRole 
            ? 'bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink shadow-neon-purple text-white opacity-100' 
            : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
          }`}
        >
          {t.continue}
        </motion.button>
      </div>
    </div>
  );
};

export default RoleSelection;
