import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  FileText, 
  Brain, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  User, 
  Calendar, 
  AlertCircle, 
  MoreHorizontal, 
  Send, 
  Video, 
  Mic, 
  Plus, 
  ChevronDown,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

interface DoctorDashboardProps {
  onLogout: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [consultationTab, setConsultationTab] = useState('chat');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState({
    symptoms: 'Severe Headache, Nausea',
    conditions: 'Migraine, Tension Headache',
    treatments: 'Rest, Hydration, Pain Relievers'
  });
  
  const [doctorData, setDoctorData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const dummyPatients = [
    { id: 'dummy1', patientName: 'Sarah Johnson', problem: 'Persistent headache', time: '10:00 AM', status: 'confirmed' },
    { id: 'dummy2', patientName: 'Michael Chen', problem: 'Back pain', time: '10:30 AM', status: 'pending' },
    { id: 'dummy3', patientName: 'Emily Davis', problem: 'Skin rash', time: '11:00 AM', status: 'pending' },
  ];
  const displayAppointments = appointments.length > 0 ? appointments : dummyPatients;
  
  const [consultations, setConsultations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionData, setPrescriptionData] = useState({
    medicineName: '',
    dosage: '',
    duration: '',
    notes: ''
  });
  const [followupData, setFollowupData] = useState({
    date: '',
    notes: ''
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Fetch Doctor Profile
    const fetchDoctorProfile = async () => {
      const docRef = doc(db, 'doctors', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDoctorData(docSnap.data());
      }
    };
    fetchDoctorProfile();

    // 2. Real-time Appointments
    const qAppointments = query(
      collection(db, 'appointments'),
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(apps);
    });

    // 3. Real-time Consultations
    const qConsultations = query(
      collection(db, 'consultations'),
      where('doctorId', '==', user.uid)
    );
    const unsubConsultations = onSnapshot(qConsultations, (snapshot) => {
      const cons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConsultations(cons);
      if (cons.length > 0 && !activeConsultation) {
        setActiveConsultation(cons[0]);
      }
    });

    // 4. Real-time Patients
    const qPatients = query(
      collection(db, 'patients'),
      where('doctorId', '==', user.uid)
    );
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
      const pts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(pts);
    });

    // 5. Real-time Prescriptions
    const qPrescriptions = query(
      collection(db, 'prescriptions'),
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubPrescriptions = onSnapshot(qPrescriptions, (snapshot) => {
      const prescs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrescriptions(prescs);
    });

    return () => {
      unsubAppointments();
      unsubConsultations();
      unsubPatients();
      unsubPrescriptions();
    };
  }, []);

  useEffect(() => {
    if (!activeConsultation) {
      setMessages([]);
      return;
    }

    if (activeConsultation.isMock) {
      setMessages([
        { id: 'm1', senderRole: 'patient', text: 'Hello Doctor, I have been feeling a bit dizzy lately.', timestamp: { toDate: () => new Date() } },
        { id: 'm2', senderRole: 'doctor', text: 'Hello! I am sorry to hear that. When did this start?', timestamp: { toDate: () => new Date() } }
      ]);
      return;
    }

    const qMessages = query(
      collection(db, 'consultations', activeConsultation.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeConsultation]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConsultation) return;

    if (activeConsultation.isMock) {
      const newMsg = {
        id: Date.now().toString(),
        senderId: 'doctor',
        senderRole: 'doctor',
        text: inputText,
        timestamp: { toDate: () => new Date() }
      };
      setMessages(prev => [...prev, newMsg]);
      setInputText('');
      return;
    }

    try {
      const messagesRef = collection(db, 'consultations', activeConsultation.id, 'messages');
      await addDoc(messagesRef, {
        senderId: auth.currentUser?.uid,
        senderRole: 'doctor',
        text: inputText,
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleGenerateAISummary = async () => {
    if (!activeConsultation || messages.length === 0) {
      alert("No messages to summarize yet.");
      return;
    }
    
    setIsGeneratingAI(true);
    // Simulate AI generation
    setTimeout(() => {
      setAiSummary({
        symptoms: "Patient reports " + messages.filter(m => m.senderRole === 'patient').slice(-1)[0]?.text.substring(0, 50) + "...",
        conditions: "Based on symptoms: Potential viral infection or stress-related fatigue.",
        treatments: "Recommended: 2 days rest, increased fluid intake, follow-up in 48 hours."
      });
      setIsGeneratingAI(false);
    }, 2000);
  };

  const handleStartConsultation = (patient: any) => {
    const existingCons = consultations.find(c => c.patientId === patient.id || c.patientId === patient.uid);
    if (existingCons) {
      setActiveConsultation(existingCons);
      setActiveTab('consultations');
    } else if (patient.id.startsWith('dummy')) {
      // Handle dummy patients for demo purposes
      setActiveConsultation({
        id: 'mock-' + patient.id,
        patientId: patient.id,
        patientName: patient.patientName,
        isMock: true
      });
      setActiveTab('consultations');
    } else {
      // Create new consultation if it doesn't exist (in a real app)
      alert("Starting new consultation for " + patient.patientName);
    }
  };

  const handleCreatePrescription = async () => {
    if (!activeConsultation || !prescriptionData.medicineName) return;

    try {
      await addDoc(collection(db, 'prescriptions'), {
        doctorId: auth.currentUser?.uid,
        patientId: activeConsultation.patientId,
        medicines: [{
          name: prescriptionData.medicineName,
          dosage: prescriptionData.dosage,
          duration: prescriptionData.duration
        }],
        notes: prescriptionData.notes,
        createdAt: new Date().toISOString()
      });
      setPrescriptionData({ medicineName: '', dosage: '', duration: '', notes: '' });
      alert("Prescription generated successfully!");
    } catch (error) {
      console.error("Error creating prescription:", error);
    }
  };

  const handleScheduleFollowup = async () => {
    if (!activeConsultation || !followupData.date) return;

    try {
      await addDoc(collection(db, 'followups'), {
        doctorId: auth.currentUser?.uid,
        patientId: activeConsultation.patientId,
        date: followupData.date,
        notes: followupData.notes,
        createdAt: new Date().toISOString()
      });
      setFollowupData({ date: '', notes: '' });
      alert("Follow-up scheduled successfully!");
    } catch (error) {
      console.error("Error scheduling follow-up:", error);
    }
  };

  const stats = [
    { label: 'Total Patients', value: patients.length.toString(), icon: <Users size={24} />, color: 'blue' },
    { label: "Today's Appointments", value: appointments.filter(a => a.status === 'confirmed').length.toString(), icon: <Calendar size={24} />, color: 'green' },
    { label: 'Active Consultations', value: consultations.length.toString(), icon: <MessageSquare size={24} />, color: 'purple' },
    { label: 'Pending Requests', value: appointments.filter(a => a.status === 'pending').length.toString(), icon: <AlertCircle size={24} />, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-[#030305] text-white flex overflow-hidden font-sans selection:bg-brand-purple/30">
      {/* Background Particles/Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-blue/10 blur-[120px] rounded-full" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.1, scale: 0 }}
            animate={{ 
              opacity: [0.1, 0.3, 0.1], 
              scale: [1, 1.2, 1],
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0]
            }}
            transition={{ duration: 5 + Math.random() * 5, repeat: Infinity }}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`,
              boxShadow: '0 0 10px white'
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="w-72 glass border-r border-white/10 flex flex-col z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-purple to-brand-blue rounded-xl flex items-center justify-center shadow-neon-purple">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Dr Drug</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
            { id: 'patients', label: 'Patients', icon: <Users size={20} /> },
            { id: 'consultations', label: 'Consultations', icon: <MessageSquare size={20} /> },
            { id: 'prescriptions', label: 'Prescriptions', icon: <FileText size={20} /> },
            { id: 'ai-tools', label: 'AI Tools', icon: <Brain size={20} /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-gradient-to-r from-brand-purple/20 to-brand-blue/20 text-brand-blue border border-white/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`${activeTab === item.id ? 'text-brand-blue' : 'group-hover:text-white'} transition-colors`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 py-8 space-y-2">
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
        {/* Top Bar */}
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients, records..." 
              className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl glass border border-white/10">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${doctorData?.isAvailable ? 'text-green-400' : 'text-white/40'}`}>
                {doctorData?.isAvailable ? 'Available' : 'Offline'}
              </span>
              <button 
                onClick={async () => {
                  const user = auth.currentUser;
                  if (!user) return;
                  const docRef = doc(db, 'doctors', user.uid);
                  await updateDoc(docRef, { isAvailable: !doctorData?.isAvailable });
                  setDoctorData((prev: any) => ({ ...prev, isAvailable: !prev.isAvailable }));
                }}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 ${doctorData?.isAvailable ? 'bg-green-400/20' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all duration-300 ${doctorData?.isAvailable ? 'right-1 bg-green-400 shadow-[0_0_10px_#4ade80]' : 'left-1 bg-white/20'}`} />
              </button>
            </div>
            <button className="relative p-3 rounded-xl glass glass-hover border border-white/10">
              <Bell size={20} className="text-white/60" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-pink rounded-full shadow-[0_0_10px_#ec4899]" />
            </button>
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl glass border border-white/10">
              <img src="https://picsum.photos/seed/doc/100/100" alt="Doctor" className="w-10 h-10 rounded-xl object-cover border border-white/20" />
              <div className="text-left">
                <p className="text-sm font-bold">{doctorData?.name || 'Dr. Smith'}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{doctorData?.specialization || 'Doctor'}</p>
              </div>
              <ChevronDown size={16} className="text-white/40" />
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass p-6 rounded-[32px] border border-white/10 relative group overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${
                      stat.color === 'blue' ? 'from-brand-blue to-transparent' :
                      stat.color === 'green' ? 'from-green-400 to-transparent' :
                      stat.color === 'purple' ? 'from-brand-purple to-transparent' :
                      'from-orange-400 to-transparent'
                    }`} />
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        stat.color === 'blue' ? 'bg-brand-blue/20 text-brand-blue' :
                        stat.color === 'green' ? 'bg-green-400/20 text-green-400' :
                        stat.color === 'purple' ? 'bg-brand-purple/20 text-brand-purple' :
                        'bg-orange-400/20 text-orange-400'
                      }`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-white/40 text-sm font-medium mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                {/* Patient Queue */}
                <div className="lg:col-span-3 glass rounded-[40px] border border-white/10 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Patient Queue</h3>
                    <button className="text-white/20 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                  </div>
                  <div className="space-y-4 flex-1">
                    {displayAppointments.map((patient) => (
                      <motion.div 
                        key={patient.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-brand-purple/30 transition-all group"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <img src={`https://picsum.photos/seed/${patient.patientName}/100/100`} alt={patient.patientName} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                          <div>
                            <p className="font-bold text-sm">{patient.patientName}</p>
                            <p className="text-[10px] text-white/40 mt-1">Problem: <span className="text-white/80">{patient.problem}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mb-4">
                          <div className="flex items-center gap-2 text-white/40">
                            <Clock size={12} />
                            <span>Time: <span className="text-green-400 font-bold">{patient.time}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <CheckCircle2 size={12} className={patient.status === 'confirmed' ? "text-green-400" : "text-orange-400"} />
                            <span>Status: <span className={patient.status === 'confirmed' ? "text-green-400 font-bold" : "text-orange-400 font-bold"}>{patient.status}</span></span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleStartConsultation(patient)}
                            className="py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white text-xs font-bold shadow-neon-blue hover:scale-105 transition-all"
                          >
                            Start
                          </button>
                          <button 
                            onClick={() => alert(`Details for ${patient.patientName}: ${patient.problem}`)}
                            className="py-2.5 rounded-xl glass border border-white/10 text-white/60 text-xs font-bold hover:bg-white/5 transition-all"
                          >
                            Details
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Consultation Hub */}
                <div className="lg:col-span-6 glass rounded-[40px] border border-white/10 p-8 flex flex-col h-[600px]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Consultation Hub</h3>
                    <button className="text-white/20 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-8 border-b border-white/5 mb-8">
                    {['chat', 'video', 'audio'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setConsultationTab(tab)}
                        className={`pb-4 px-2 text-sm font-bold capitalize relative transition-all ${
                          consultationTab === tab ? 'text-brand-blue' : 'text-white/40 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tab === 'chat' && <MessageSquare size={16} />}
                          {tab === 'video' && <Video size={16} />}
                          {tab === 'audio' && <Mic size={16} />}
                          {tab}
                        </div>
                        {consultationTab === tab && (
                          <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue shadow-[0_0_10px_#06b6d4]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Chat Interface */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                      {messages.map((msg: any, i: number) => (
                        <div key={i} className={`flex flex-col ${msg.senderRole === 'doctor' ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {msg.senderRole === 'doctor' && <span className="text-[10px] font-bold text-white/40">You</span>}
                            <img src={`https://picsum.photos/seed/${msg.senderId}/100/100`} alt={msg.senderId} className="w-6 h-6 rounded-full" />
                            {msg.senderRole !== 'doctor' && <span className="text-[10px] font-bold text-white/40">Patient</span>}
                          </div>
                          <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.senderRole === 'doctor' 
                            ? 'bg-brand-blue/20 border border-brand-blue/20 rounded-tr-none'
                            : 'bg-white/5 border border-white/10 rounded-tl-none' 
                          }`}>
                            <p>{msg.text}</p>
                            <p className="text-[10px] text-white/30 mt-2 text-right">
                              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {!activeConsultation && (
                        <div className="text-center py-20 text-white/20 italic">Select a consultation to start chatting</div>
                      )}
                    </div>
                    
                    <div className="mt-8 relative">
                      <input 
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="w-full pl-6 pr-20 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl bg-brand-blue text-white text-sm font-bold shadow-neon-blue hover:scale-105 transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Consultation Summary */}
                <div className="lg:col-span-3 glass rounded-[40px] border border-brand-blue/30 p-8 flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                  <h3 className="text-xl font-bold mb-8 text-brand-blue">AI Consultation Summary</h3>
                  <div className="space-y-8 flex-1">
                    {isGeneratingAI ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-10 h-10 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
                        <p className="text-xs text-white/40 font-bold animate-pulse">Analyzing Chat History...</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Symptoms</p>
                          <p className="text-sm text-white/80 leading-relaxed">{aiSummary.symptoms}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Possible Conditions</p>
                          <p className="text-sm text-white/80 leading-relaxed">{aiSummary.conditions}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Suggested Treatments</p>
                          <p className="text-sm text-white/80 leading-relaxed">{aiSummary.treatments}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <button 
                    onClick={handleGenerateAISummary}
                    disabled={isGeneratingAI}
                    className={`w-full py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-bold shadow-neon-blue hover:scale-105 transition-all mt-8 ${isGeneratingAI ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isGeneratingAI ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Patient Records */}
                <div className="lg:col-span-4 glass rounded-[40px] border border-white/10 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Patient Records</h3>
                    <button className="text-white/20 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                  </div>
                  <p className="text-xs text-white/40 mb-8 leading-relaxed">
                    Preview medical history, anomalies from allergies, and past prescriptions with past prescriptions.
                  </p>
                  <div className="flex gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 overflow-hidden group cursor-pointer">
                        <img 
                          src={`https://picsum.photos/seed/presc${i}/300/400`} 
                          alt="Prescription" 
                          className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity duration-500" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prescription Creator */}
                <div className="lg:col-span-5 glass rounded-[40px] border border-white/10 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Prescription Creator</h3>
                    <button className="text-white/20 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        value={prescriptionData.medicineName}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, medicineName: e.target.value }))}
                        placeholder="Medicine Name" 
                        className="w-full px-6 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="relative">
                      <select 
                        value={prescriptionData.dosage}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, dosage: e.target.value }))}
                        className="w-full px-6 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all text-sm appearance-none text-white/60"
                      >
                        <option value="">Dosage</option>
                        <option value="1-0-1">1-0-1</option>
                        <option value="1-1-1">1-1-1</option>
                        <option value="0-0-1">0-0-1</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                    </div>
                    <div className="relative">
                      <select 
                        value={prescriptionData.duration}
                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full px-6 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all text-sm appearance-none text-white/60"
                      >
                        <option value="">Duration</option>
                        <option value="3 Days">3 Days</option>
                        <option value="1 Week">1 Week</option>
                        <option value="1 Month">1 Month</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                    </div>
                  </div>
                  <textarea 
                    value={prescriptionData.notes}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes" 
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all text-sm h-24 mb-6 resize-none"
                  ></textarea>
                  <button 
                    onClick={handleCreatePrescription}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-bold shadow-neon-blue hover:scale-105 transition-all"
                  >
                    Generate Digital Prescription
                  </button>
                </div>

                {/* Follow-up */}
                <div className="lg:col-span-3 glass rounded-[40px] border border-white/10 p-8">
                  <h3 className="text-xl font-bold mb-8">Follow-up</h3>
                  <div className="space-y-4 mb-8">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="date" 
                        value={followupData.date}
                        onChange={(e) => setFollowupData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full pl-12 pr-10 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all text-sm text-white/60"
                      />
                    </div>
                    <textarea 
                      value={followupData.notes}
                      onChange={(e) => setFollowupData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes" 
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all text-sm h-32 resize-none"
                    ></textarea>
                  </div>
                  <button 
                    onClick={handleScheduleFollowup}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-bold shadow-neon-blue hover:scale-105 transition-all"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'patients' && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-[40px] border border-white/10 p-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Patient Management</h2>
                <div className="relative w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter patients..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const displayList = (patients.length > 0 ? patients : dummyPatients.map(d => ({ ...d, name: d.patientName })))
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
                  
                  if (displayList.length === 0) {
                    return <div className="col-span-full text-center py-20 text-white/20 italic">No patients found matching your search.</div>;
                  }

                  return displayList.map((p) => (
                    <div key={p.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-brand-blue/30 transition-all">
                      <div className="flex items-center gap-4 mb-6">
                        <img src={`https://picsum.photos/seed/${p.name}/100/100`} alt={p.name} className="w-16 h-16 rounded-2xl object-cover" />
                        <div>
                          <p className="font-bold text-lg">{p.name}</p>
                          <p className="text-xs text-white/40">{p.email}</p>
                        </div>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Blood Group</span>
                          <span className="text-brand-pink font-bold">{p.bloodGroup || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Last Visit</span>
                          <span>{p.lastVisit || 'Today'}</span>
                        </div>
                      </div>
                      <button className="w-full py-3 rounded-xl glass border border-white/10 text-brand-blue font-bold hover:bg-brand-blue/10 transition-all">View History</button>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          )}

          {activeTab === 'consultations' && (
            <motion.div
              key="consultations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-[800px] flex gap-8"
            >
              {/* Consultation List */}
              <div className="w-80 glass rounded-[40px] border border-white/10 p-6 flex flex-col">
                <h3 className="text-xl font-bold mb-6">Active Chats</h3>
                <div className="space-y-3 overflow-y-auto custom-scrollbar">
                  {consultations.map((c) => (
                    <button 
                      key={c.id}
                      onClick={() => setActiveConsultation(c)}
                      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                        activeConsultation?.id === c.id ? 'bg-brand-blue/20 border border-brand-blue/30' : 'hover:bg-white/5'
                      }`}
                    >
                      <img src={`https://picsum.photos/seed/${c.patientId}/100/100`} alt="Patient" className="w-10 h-10 rounded-xl" />
                      <div className="text-left">
                        <p className="text-sm font-bold truncate w-32">Patient ID: {c.patientId.substring(0, 8)}</p>
                        <p className="text-[10px] text-white/40">Active Now</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 glass rounded-[40px] border border-white/10 p-8 flex flex-col">
                {activeConsultation ? (
                  <>
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <img src={`https://picsum.photos/seed/${activeConsultation.patientId}/100/100`} alt="Patient" className="w-12 h-12 rounded-2xl" />
                        <div>
                          <p className="font-bold">Patient ID: {activeConsultation.patientId}</p>
                          <p className="text-xs text-green-400 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Online
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button className="p-3 rounded-xl glass glass-hover text-brand-blue"><Video size={20} /></button>
                        <button className="p-3 rounded-xl glass glass-hover text-brand-purple"><Mic size={20} /></button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
                      {messages.map((msg: any, i: number) => (
                        <div key={i} className={`flex flex-col ${msg.senderRole === 'doctor' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                            msg.senderRole === 'doctor' 
                            ? 'bg-brand-blue/20 border border-brand-blue/20 rounded-tr-none'
                            : 'bg-white/5 border border-white/10 rounded-tl-none' 
                          }`}>
                            <p>{msg.text}</p>
                            <p className="text-[10px] text-white/30 mt-2">
                              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : '...'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 relative">
                      <input 
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="w-full pl-6 pr-20 py-5 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 rounded-xl bg-brand-blue text-white font-bold shadow-neon-blue hover:scale-105 transition-all"
                      >
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                    <MessageSquare size={64} className="mb-6 opacity-10" />
                    <p className="text-xl font-medium">Select a consultation to start</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'prescriptions' && (
            <motion.div
              key="prescriptions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-[40px] border border-white/10 p-10"
            >
              <h2 className="text-3xl font-bold mb-8">Prescription History</h2>
              <div className="space-y-4">
                {prescriptions.length > 0 ? prescriptions.map((p) => (
                  <div key={p.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple">
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Prescription for {p.patientId.substring(0, 8)}</p>
                        <p className="text-xs text-white/40">Medicine: {p.medicines?.[0]?.name} • {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Today'}</p>
                      </div>
                    </div>
                    <button className="px-6 py-2 rounded-xl glass border border-white/10 text-sm font-bold hover:text-brand-blue transition-all">View Details</button>
                  </div>
                )) : (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-all opacity-50">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-brand-purple/20 flex items-center justify-center text-brand-purple">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="font-bold">Sample Prescription #{1000 + i}</p>
                          <p className="text-xs text-white/40">Demo Data • Issued April {10 + i}, 2026</p>
                        </div>
                      </div>
                      <button className="px-6 py-2 rounded-xl glass border border-white/10 text-sm font-bold hover:text-brand-blue transition-all">Download PDF</button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'ai-tools' && (
            <motion.div
              key="ai-tools"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="glass rounded-[40px] border border-brand-purple/30 p-10">
                <div className="w-16 h-16 bg-brand-purple/20 rounded-2xl flex items-center justify-center text-brand-purple mb-8">
                  <Brain size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-4">AI Symptom Checker</h2>
                <p className="text-white/50 mb-8 leading-relaxed">Advanced diagnostic assistant powered by Gemini. Input patient symptoms for real-time analysis and risk assessment.</p>
                <textarea 
                  placeholder="Describe patient symptoms in detail..."
                  className="w-full h-40 p-6 rounded-3xl bg-white/5 border border-white/10 focus:border-brand-purple outline-none transition-all mb-6 resize-none"
                ></textarea>
                <button className="w-full py-4 rounded-2xl bg-brand-purple text-white font-bold shadow-neon-purple hover:scale-105 transition-all">Analyze Symptoms</button>
              </div>
              <div className="glass rounded-[40px] border border-brand-blue/30 p-10">
                <div className="w-16 h-16 bg-brand-blue/20 rounded-2xl flex items-center justify-center text-brand-blue mb-8">
                  <Activity size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-4">Anomaly Detection</h2>
                <p className="text-white/50 mb-8 leading-relaxed">Real-time monitoring of patient vitals and lab results. AI will flag any deviations from normal ranges instantly.</p>
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 border-dashed text-center">
                  <p className="text-sm text-white/30 italic">Upload Lab Results (PDF/Image)</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-[40px] border border-white/10 p-10"
            >
              <h2 className="text-3xl font-bold mb-10">Practice Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="p-8 rounded-[32px] bg-white/5 border border-white/10">
                  <p className="text-white/40 text-sm mb-2">Patient Growth</p>
                  <p className="text-4xl font-bold text-brand-blue">+12%</p>
                  <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-blue w-[70%]" />
                  </div>
                </div>
                <div className="p-8 rounded-[32px] bg-white/5 border border-white/10">
                  <p className="text-white/40 text-sm mb-2">Consultation Success</p>
                  <p className="text-4xl font-bold text-brand-purple">98.4%</p>
                  <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-purple w-[98%]" />
                  </div>
                </div>
                <div className="p-8 rounded-[32px] bg-white/5 border border-white/10">
                  <p className="text-white/40 text-sm mb-2">Avg. Response Time</p>
                  <p className="text-4xl font-bold text-brand-pink">4.2m</p>
                  <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-pink w-[40%]" />
                  </div>
                </div>
              </div>
              <div className="h-80 w-full bg-white/5 rounded-[40px] border border-white/10 flex items-center justify-center">
                <p className="text-white/20 italic">Detailed charts and trends visualization coming soon</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DoctorDashboard;
