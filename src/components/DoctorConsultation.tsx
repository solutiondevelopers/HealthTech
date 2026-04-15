import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Send, 
  User, 
  ArrowLeft, 
  MoreVertical, 
  PhoneCall, 
  VideoOff,
  Clock,
  CheckCircle2,
  Circle,
  Camera,
  Mic,
  ShieldCheck
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  senderRole: 'doctor' | 'patient';
  text: string;
  timestamp: any;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  status: 'online' | 'offline';
  avatar: string;
}

const doctors: Doctor[] = [
  { id: 'mock1', name: "Dr. Sharma", specialization: "General Physician", status: 'online', avatar: "https://picsum.photos/seed/doc1/100/100" },
  { id: 'mock2', name: "Dr. Patil", specialization: "Cardiologist", status: 'offline', avatar: "https://picsum.photos/seed/doc2/100/100" },
  { id: 'mock3', name: "Dr. Joshi", specialization: "Ayurveda", status: 'online', avatar: "https://picsum.photos/seed/doc3/100/100" },
];

const DoctorConsultation: React.FC<{ onBack: () => void, initialDoctor?: any }> = ({ onBack, initialDoctor }) => {
  const [activeTab, setActiveTab] = useState<'options' | 'chat' | 'call' | 'video'>(initialDoctor ? 'chat' : 'options');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(() => {
    if (initialDoctor) {
      return {
        id: initialDoctor.id,
        name: initialDoctor.doctorName || initialDoctor.name,
        specialization: initialDoctor.specialization,
        status: 'online',
        avatar: `https://picsum.photos/seed/doc${initialDoctor.id}/100/100`
      };
    }
    return doctors[0];
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const consultationId = useMemo(() => {
    const patientId = auth.currentUser?.uid;
    if (!patientId || !selectedDoctor.id) return null;
    return `${selectedDoctor.id}_${patientId}`;
  }, [selectedDoctor.id]);

  useEffect(() => {
    if (!consultationId || activeTab !== 'chat') return;

    const ensureConsultation = async () => {
      const consRef = doc(db, 'consultations', consultationId);
      const snap = await getDoc(consRef);
      if (!snap.exists()) {
        await setDoc(consRef, {
          doctorId: selectedDoctor.id,
          patientId: auth.currentUser?.uid,
          createdAt: serverTimestamp()
        });
      }
    };

    ensureConsultation();

    const q = query(
      collection(db, 'consultations', consultationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [consultationId, activeTab]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeTab === 'video') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeTab]);

  useEffect(() => {
    if (initialDoctor && activeTab === 'chat') {
      // Small delay to allow animation to complete
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, [initialDoctor, activeTab]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !consultationId) return;

    try {
      const messagesRef = collection(db, 'consultations', consultationId, 'messages');
      await addDoc(messagesRef, {
        senderId: auth.currentUser?.uid,
        senderRole: 'patient',
        text: inputText,
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const availableDoctors = useMemo(() => {
    if (initialDoctor && !doctors.find(d => d.id === initialDoctor.id)) {
      const newDoc: Doctor = {
        id: initialDoctor.id,
        name: initialDoctor.doctorName || initialDoctor.name,
        specialization: initialDoctor.specialization,
        status: 'online',
        avatar: `https://picsum.photos/seed/doc${initialDoctor.id}/100/100`
      };
      return [newDoc, ...doctors];
    }
    return doctors;
  }, [initialDoctor]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={activeTab === 'options' ? onBack : () => setActiveTab('options')}
          className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-bold">
            {initialDoctor ? `Consulting with ${selectedDoctor.name}` : 'Doctor Consultation'}
          </h2>
          <p className="text-white/40">
            {initialDoctor ? `${selectedDoctor.specialization}` : 'Connect with doctors instantly'}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'options' && (
          <motion.div 
            key="options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { id: 'chat', label: 'Chat with Doctor', icon: <MessageSquare size={32} />, color: '#8b5cf6', desc: 'Instant text consultation' },
              { id: 'call', label: 'Call Doctor', icon: <Phone size={32} />, color: '#06b6d4', desc: 'Direct voice connection' },
              { id: 'video', label: 'Video Consultation', icon: <Video size={32} />, color: '#ec4899', desc: 'Face-to-face virtual visit' },
            ].map((opt) => (
              <motion.div
                key={opt.id}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => setActiveTab(opt.id as any)}
                className="glass p-8 rounded-[40px] border border-white/5 group cursor-pointer relative overflow-hidden flex flex-col items-center text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110"
                  style={{ 
                    background: `${opt.color}15`,
                    boxShadow: `inset 0 0 30px ${opt.color}10`
                  }}
                >
                  <div style={{ color: opt.color }} className="drop-shadow-neon-blue">
                    {opt.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-brand-blue transition-colors">{opt.label}</h3>
                <p className="text-white/40 text-sm">{opt.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col md:flex-row gap-6 h-[600px]"
          >
            {/* Doctor List */}
            <div className="w-full md:w-80 glass rounded-[32px] border border-white/10 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/5">
                <h3 className="font-bold text-lg">Available Doctors</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {availableDoctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                      selectedDoctor.id === doc.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      <img src={doc.avatar} alt={doc.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#030305] ${doc.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{doc.name}</p>
                      <p className="text-xs text-white/40">{doc.specialization}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 glass rounded-[32px] border border-white/10 overflow-hidden flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedDoctor.name}</h3>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <Circle size={8} fill="currentColor" /> {selectedDoctor.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-white/40"><Phone size={18} /></button>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-white/40"><Video size={18} /></button>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-white/40"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderRole === 'patient' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${msg.senderRole === 'patient' ? 'bg-brand-blue/20 rounded-2xl rounded-tr-none border border-brand-blue/20' : 'bg-white/5 rounded-2xl rounded-tl-none border border-white/10'} p-4`}>
                      <p className="text-sm text-white/90">{msg.text}</p>
                      <p className="text-[10px] text-white/30 mt-2 text-right">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 rounded-2xl rounded-tl-none border border-white/10 p-4 flex gap-1">
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-6 border-t border-white/5 bg-white/5">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 outline-none focus:border-brand-blue transition-all"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="w-12 h-12 rounded-2xl bg-brand-blue flex items-center justify-center text-white shadow-neon-blue hover:scale-105 transition-all active:scale-95"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'call' && (
          <motion.div 
            key="call"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto glass p-12 rounded-[40px] border border-white/10 text-center"
          >
            <div className="w-32 h-32 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-brand-blue/20 rounded-full animate-ping" />
              <PhoneCall size={64} className="text-brand-blue relative z-10" />
            </div>
            <h3 className="text-3xl font-bold mb-2">Dr. Sharma</h3>
            <p className="text-brand-blue font-medium mb-8">General Physician</p>
            
            <div className="flex flex-col gap-4">
              <a 
                href="tel:8530988145"
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-bold text-lg shadow-neon-blue flex items-center justify-center gap-3 hover:scale-105 transition-all"
              >
                <Phone size={24} />
                Call Now
              </a>
              <button 
                onClick={() => setActiveTab('options')}
                className="w-full py-5 rounded-2xl glass border border-white/10 font-bold text-white/60 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'video' && (
          <motion.div 
            key="video"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto glass rounded-[40px] border border-white/10 overflow-hidden"
          >
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Overlay UI */}
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Live Preview
                </div>
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
                <button className="w-14 h-14 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                  <Camera size={24} />
                </button>
                <button className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-110 transition-all active:scale-95">
                  <VideoOff size={32} />
                </button>
                <button className="w-14 h-14 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                  <Mic size={24} />
                </button>
              </div>

              {/* Doctor Small Preview */}
              <div className="absolute top-6 right-6 w-48 aspect-video glass rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                <img src="https://picsum.photos/seed/doc1/300/200" alt="Doctor" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <User size={32} className="text-white/20 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Waiting for Doctor...</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-pink/20 flex items-center justify-center text-brand-pink">
                  <Video size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Video Consultation</h3>
                  <p className="text-sm text-white/40">Dr. Sharma is ready to join</p>
                </div>
              </div>
              <button className="px-8 py-3 rounded-2xl bg-brand-blue text-white font-bold shadow-neon-blue hover:scale-105 transition-all">
                Start Video Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="mt-12 flex items-center justify-center gap-8 text-white/20">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">End-to-End Encrypted</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">24/7 Availability</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="text-xs font-medium uppercase tracking-widest">Verified Doctors</span>
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultation;
