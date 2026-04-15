import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, CheckCircle2, PenTool, FileText, CreditCard, Home, Activity, Upload, ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { Language } from '../utils/translations';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface DoctorRegistrationProps {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
  t: any;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const FloatingCapsule = ({ x, y, color, delay = 0, rotate = 0 }: { x: string, y: string, color: string, delay?: number, rotate?: number }) => (
  <motion.div
    initial={{ opacity: 0.15 }}
    animate={{
      y: [0, -25, 0],
      rotate: [rotate, rotate + 10, rotate - 10, rotate],
      opacity: [0.15, 0.3, 0.15],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    style={{ left: x, top: y }}
    className="absolute pointer-events-none z-0 blur-[3px]"
  >
    <div 
      className="w-16 h-8 rounded-full border-2"
      style={{ 
        borderColor: `${color}33`,
        boxShadow: `0 0 25px ${color}22`,
        background: `linear-gradient(90deg, ${color}11 50%, transparent 50%)`
      }}
    />
  </motion.div>
);

const FileStatus = ({ file, onClear }: { file: File | null, onClear: () => void }) => (
  <AnimatePresence>
    {file && (
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="mt-2 flex items-center justify-between bg-brand-blue/10 px-3 py-2 rounded-lg border border-brand-blue/20"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Check className="text-brand-blue w-3 h-3 flex-shrink-0" />
          <span className="text-[10px] font-medium text-brand-blue truncate">{file.name}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="p-1 hover:bg-brand-blue/20 rounded-full transition-colors"
        >
          <X className="text-brand-blue w-3 h-3" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const DoctorRegistration: React.FC<DoctorRegistrationProps> = ({ onBack, onLogin, onSuccess, t, language, onLanguageChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    registrationNumber: '',
    systemOfMedicine: '',
    specialization: '',
    experience: '',
    clinicName: '',
    phone: '',
    address: ''
  });

  const [files, setFiles] = useState<{
    signature: File | null;
    degree: File | null;
    govId: File | null;
    clinic: File | null;
  }>({
    signature: null,
    degree: null,
    govId: null,
    clinic: null
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const degreeInputRef = useRef<HTMLInputElement>(null);
  const govIdInputRef = useRef<HTMLInputElement>(null);
  const clinicInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (key: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [key]: file }));
    }
  };

  const clearFile = (key: keyof typeof files) => {
    setFiles(prev => ({ ...prev, [key]: null }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFiles(prev => ({ ...prev, signature: file }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create User Account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Store User Profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: 'doctor',
        createdAt: new Date().toISOString()
      });

      // 3. Store Doctor Verification Data
      await setDoc(doc(db, 'doctors', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        registrationNumber: formData.registrationNumber,
        systemOfMedicine: formData.systemOfMedicine,
        specialization: formData.specialization,
        experience: Number(formData.experience),
        clinicName: formData.clinicName,
        phone: formData.phone,
        address: formData.address,
        location: {
          latitude: 18.5074 + (Math.random() - 0.5) * 0.01,
          longitude: 73.8077 + (Math.random() - 0.5) * 0.01
        },
        isAvailable: true,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      localStorage.setItem('userRole', 'doctor');
      setIsSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 3000);
    } catch (error: any) {
      console.error("Doctor registration error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setError("Registration is currently disabled. Please enable Email/Password in the Firebase Console.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login instead.");
      } else {
        setError("Registration failed: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-white relative overflow-hidden flex flex-col">
      {/* Hidden Inputs */}
      <input type="file" ref={sigInputRef} onChange={handleFileChange('signature')} accept="image/*" className="hidden" />
      <input type="file" ref={degreeInputRef} onChange={handleFileChange('degree')} accept=".pdf,image/*" className="hidden" />
      <input type="file" ref={govIdInputRef} onChange={handleFileChange('govId')} accept=".pdf,image/*" className="hidden" />
      <input type="file" ref={clinicInputRef} onChange={handleFileChange('clinic')} accept=".pdf,image/*" className="hidden" />
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-purple/10 blur-[180px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-blue/10 blur-[180px] rounded-full" />

      {/* Floating Elements */}
      <FloatingCapsule x="8%" y="12%" color="#8b5cf6" delay={0} rotate={-15} />
      <FloatingCapsule x="82%" y="18%" color="#06b6d4" delay={1.5} rotate={25} />
      <FloatingCapsule x="15%" y="78%" color="#ec4899" delay={2.5} rotate={10} />
      <FloatingCapsule x="88%" y="82%" color="#8b5cf6" delay={0.8} rotate={-20} />

      {/* Navbar */}
      <nav className="relative z-20 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
          <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center shadow-neon-blue">
            <Stethoscope className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Dr Drug</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'For Doctors', 'About Us', 'Blog'].map((item) => (
            <a key={item} href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">{item}</a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="px-6 py-2 rounded-full border border-brand-purple/50 text-sm font-semibold hover:bg-brand-purple/10 transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            Login
          </button>
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
        
        {/* Left Side - Info */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:sticky lg:top-32 space-y-10"
        >
          <div className="space-y-6">
            <h1 className="text-6xl font-bold leading-tight tracking-tight">
              {t.joinVerified.split('Verified Doctor')[0]} <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple">{t.verifiedDoctor}</span>
            </h1>
            <p className="text-white/50 text-xl max-w-md leading-relaxed">
              {t.doctorSubtext}
            </p>
          </div>

          <div className="space-y-6">
            {[
              t.point1,
              t.point2,
              t.point3
            ].map((text, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-6 h-6 rounded-full bg-brand-blue/20 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <CheckCircle2 className="text-brand-blue w-4 h-4" />
                </div>
                <span className="text-lg font-medium text-white/80">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Form Card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full"
        >
          <div className="glass p-10 rounded-[2.5rem] border-brand-purple/20 shadow-2xl relative">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">{t.signUp}</h2>
              <button onClick={onBack} className="p-2 rounded-full glass glass-hover text-white/50 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-20 text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-brand-blue/20 rounded-full flex items-center justify-center mx-auto shadow-neon-blue">
                    <CheckCircle2 className="text-brand-blue w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-bold">Registration Submitted!</h3>
                  <p className="text-white/50">Our team will verify your documents within 24-48 hours.</p>
                </motion.div>
              ) : (
                <form className="space-y-10" onSubmit={handleSubmit}>
                  
                  {/* Section 1 */}
                  <div className="space-y-6">
                    <h3 className="text-white/40 text-sm font-bold tracking-widest uppercase">{t.profIdentity}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input 
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder={t.drName}
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                      />
                      <input 
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email" 
                        placeholder={t.email}
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input 
                        required
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        type="password" 
                        placeholder={t.password}
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                      />
                      <input 
                        required
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder={t.medRegNo}
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div className="relative">
                      <select 
                        required 
                        name="systemOfMedicine"
                        value={formData.systemOfMedicine}
                        onChange={handleInputChange}
                        className="w-full px-6 py-4 rounded-2xl bg-[#0a0a0c] border border-white/10 focus:border-brand-blue outline-none transition-all text-white/40 appearance-none cursor-pointer"
                      >
                        <option value="">{t.sysMedicine}</option>
                        <option value="modern">Modern Medicine (MBBS)</option>
                        <option value="ayurveda">Ayurveda (BAMS)</option>
                        <option value="homeopathy">Homeopathy (BHMS)</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                        <Activity size={18} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input 
                        required
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder={t.specialization}
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20"
                      />
                      <input 
                        required
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        type="number" 
                        placeholder={t.experience}
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input 
                        required
                        name="clinicName"
                        value={formData.clinicName}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="Clinic/Hospital Name"
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20"
                      />
                      <input 
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        type="tel" 
                        placeholder="Phone Number"
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                      <input 
                        required
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        type="text" 
                        placeholder="Clinic Address (e.g. Kothrud, Pune)"
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-6">
                    <h3 className="text-white/40 text-sm font-bold tracking-widest uppercase">{t.digiSig}</h3>
                    <div 
                      onClick={() => sigInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${
                        isDragging ? 'border-brand-purple bg-brand-purple/5' : 'border-white/10 hover:border-brand-purple/50'
                      }`}
                    >
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform ${
                        files.signature ? 'bg-brand-blue/20' : 'bg-brand-purple/10 group-hover:scale-110'
                      }`}>
                        {files.signature ? <Check className="text-brand-blue w-8 h-8" /> : <PenTool className="text-brand-purple w-8 h-8" />}
                      </div>
                      <div className="text-center">
                        <p className="text-white/60">
                          {files.signature ? files.signature.name : <>{t.uploadSig.split('Browse')[0]} <span className="text-brand-purple font-bold">Browse</span></>}
                        </p>
                        {files.signature && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); clearFile('signature'); }}
                            className="text-xs text-brand-purple mt-2 hover:underline"
                          >
                            Change Signature
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-6">
                    <h3 className="text-white/40 text-sm font-bold tracking-widest uppercase">{t.verDocs}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { icon: <FileText size={20} />, label: t.degreeCert, key: 'degree' as const, ref: degreeInputRef },
                        { icon: <CreditCard size={20} />, label: t.govId, key: 'govId' as const, ref: govIdInputRef },
                        { icon: <Home size={20} />, label: t.clinicProof, key: 'clinic' as const, ref: clinicInputRef }
                      ].map((doc, i) => (
                        <div key={i} className="flex flex-col">
                          <div 
                            onClick={() => doc.ref.current?.click()}
                            className={`glass p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer group h-full ${
                              files[doc.key] ? 'border-brand-blue/50 bg-brand-blue/5' : 'border-white/5 hover:border-brand-blue/30'
                            }`}
                          >
                            <div className={`transition-transform ${files[doc.key] ? 'text-brand-blue' : 'text-brand-blue group-hover:scale-110'}`}>
                              {files[doc.key] ? <Check size={20} /> : doc.icon}
                            </div>
                            <span className="text-xs font-medium text-white/50 text-center">{doc.label}</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-blue uppercase tracking-wider">
                              <Upload size={10} />
                              {files[doc.key] ? 'Replace' : t.upload}
                            </div>
                          </div>
                          <FileStatus file={files[doc.key]} onClear={() => clearFile(doc.key)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 space-y-4">
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3"
                        >
                          <AlertCircle size={18} />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={!isSubmitting ? { scale: 1.02, boxShadow: "0 0 40px rgba(6, 182, 212, 0.4)" } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      className={`w-full py-5 rounded-full text-lg font-bold shadow-neon-blue text-white flex items-center justify-center gap-3 transition-all ${
                        isSubmitting ? 'bg-white/10 cursor-not-allowed' : 'bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        t.submitVer
                      )}
                    </motion.button>
                    <p className="text-center text-xs text-white/30">{t.verNote}</p>
                  </div>

                </form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default DoctorRegistration;
