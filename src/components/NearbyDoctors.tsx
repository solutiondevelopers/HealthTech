import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Phone, Navigation, Calendar, Star, ArrowLeft, Building2, User, Stethoscope, Activity, HeartPulse } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const doctorsData = [
  {
    id: 1,
    hospitalName: "Sanjeevan Hospital",
    address: "Karve Road, Kothrud, Pune",
    distance: 1.2,
    doctorName: "Dr. Ramesh Patil",
    specialization: "General Physician",
    fees: 500,
    category: "Hospital",
    lat: 18.5085,
    lng: 73.8102,
    phone: "+91 98765 43210",
    isAvailable: true
  },
  {
    id: 2,
    hospitalName: "Smile Care Dental Clinic",
    address: "Paud Road, Kothrud, Pune",
    distance: 0.8,
    doctorName: "Dr. Anjali Sharma",
    specialization: "Dentist",
    fees: 400,
    category: "Dental",
    lat: 18.5060,
    lng: 73.8050,
    phone: "+91 98765 43211",
    isAvailable: true
  },
  {
    id: 3,
    hospitalName: "Ayush Ayurveda Clinic",
    address: "Dahanukar Colony, Kothrud, Pune",
    distance: 2.1,
    doctorName: "Dr. Vikram Deshmukh",
    specialization: "Ayurveda",
    fees: 300,
    category: "Ayurveda",
    lat: 18.5020,
    lng: 73.8150,
    phone: "+91 98765 43212",
    isAvailable: true
  },
  {
    id: 4,
    hospitalName: "Motherhood Women's Clinic",
    address: "Kothrud Stand, Pune",
    distance: 1.5,
    doctorName: "Dr. Smita Joshi",
    specialization: "Gynecologist",
    fees: 800,
    category: "Clinic",
    lat: 18.5090,
    lng: 73.8020,
    phone: "+91 98765 43213",
    isAvailable: true
  },
  {
    id: 5,
    hospitalName: "Active Life Physiotherapy",
    address: "Bhusari Colony, Kothrud, Pune",
    distance: 2.5,
    doctorName: "Dr. Rohan Kulkarni",
    specialization: "Physiotherapy",
    fees: 600,
    category: "Physiotherapy",
    lat: 18.5110,
    lng: 73.7980,
    phone: "+91 98765 43214",
    isAvailable: true
  },
  {
    id: 6,
    hospitalName: "Sahyadri Super Speciality Hospital",
    address: "Deccan Gymkhana, Pune",
    distance: 4.5,
    doctorName: "Dr. Sameer Kadam",
    specialization: "Cardiologist",
    fees: 1200,
    category: "Hospital",
    lat: 18.5150,
    lng: 73.8400,
    phone: "+91 98765 43215",
    isAvailable: true
  },
  {
    id: 7,
    hospitalName: "Healing Hands Homeopathy",
    address: "Mayur Colony, Kothrud, Pune",
    distance: 1.8,
    doctorName: "Dr. Neha Gokhale",
    specialization: "Homeopathy",
    fees: 400,
    category: "Homeopathy",
    lat: 18.5040,
    lng: 73.8120,
    phone: "+91 98765 43216",
    isAvailable: true
  },
  {
    id: 8,
    hospitalName: "City Care Clinic",
    address: "Karve Nagar, Pune",
    distance: 3.0,
    doctorName: "Dr. Amit Shah",
    specialization: "General Physician",
    fees: 450,
    category: "Clinic",
    lat: 18.4950,
    lng: 73.8200,
    phone: "+91 98765 43217",
    isAvailable: true
  }
];

const categories = ["All", "General Physician", "Dentist", "Gynecologist", "Ayurveda", "Physiotherapy", "Homeopathy"];

const NearbyDoctors: React.FC<{ onBack: () => void, onBookConsultation: (doctor: any) => void }> = ({ onBack, onBookConsultation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [liveDoctors, setLiveDoctors] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'doctors'), where('isAvailable', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          doctorName: data.name,
          specialization: data.specialization,
          hospitalName: data.clinicName,
          address: data.address,
          phone: data.phone,
          lat: data.location?.latitude,
          lng: data.location?.longitude,
          distance: 0.5 + Math.random() * 2, // Mock distance for now
          fees: 500,
          category: "Clinic",
          isAvailable: data.isAvailable
        };
      });
      setLiveDoctors(docs);
    });

    return () => unsubscribe();
  }, []);

  const allDoctors = useMemo(() => {
    return [...doctorsData, ...liveDoctors];
  }, [liveDoctors]);

  const filteredDoctors = useMemo(() => {
    return allDoctors
      .filter(doc => {
        const matchesSearch = 
          doc.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || doc.specialization === selectedCategory || doc.category === selectedCategory;
        return matchesSearch && matchesCategory && doc.isAvailable;
      })
      .sort((a, b) => a.distance - b.distance);
  }, [searchQuery, selectedCategory, allDoctors]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-bold">Nearby Doctors</h2>
          <p className="text-white/40">Find and book consultations with top doctors near you</p>
        </div>
      </div>

      {!selectedDoctor ? (
        <div className="space-y-8">
          <div className="glass p-6 rounded-[32px] border border-white/10">
            <div className="relative mb-6">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="text"
                placeholder="Search doctor or specialization (e.g., Cardiologist)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                    selectedCategory === cat 
                      ? 'bg-brand-blue text-white border-brand-blue shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                      : 'glass border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredDoctors.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`glass p-6 rounded-[32px] border cursor-pointer group transition-all ${
                    index === 0 && searchQuery === '' && selectedCategory === 'All'
                      ? 'border-brand-blue shadow-[0_0_30px_rgba(6,182,212,0.15)]'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-brand-blue">
                      <User size={24} />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-brand-pink">
                      {doc.category}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1 group-hover:text-brand-blue transition-colors">{doc.doctorName}</h3>
                  <p className="text-brand-purple font-medium mb-4">{doc.specialization}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Building2 size={16} className="text-white/40" />
                      <span className="font-medium text-white/80">{doc.hospitalName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <MapPin size={16} className="text-white/40" />
                      {doc.distance} km away
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <Activity size={16} className="text-white/40" />
                      ₹{doc.fees} Consultation
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredDoctors.length === 0 && (
              <div className="col-span-full py-12 text-center text-white/40">
                No doctors found matching your criteria.
              </div>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[40px] border border-white/10"
        >
          <div className="flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 border border-white/10 flex items-center justify-center text-brand-blue">
                  <Stethoscope size={40} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold">{selectedDoctor.doctorName}</h2>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-brand-pink">
                      {selectedDoctor.category}
                    </span>
                  </div>
                  <p className="text-xl text-brand-purple font-medium">{selectedDoctor.specialization}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-blue">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Hospital / Clinic</p>
                    <p className="font-medium">{selectedDoctor.hospitalName}</p>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-pink">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Consultation Fees</p>
                    <p className="font-medium">₹{selectedDoctor.fees}</p>
                  </div>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/5 flex items-center gap-4 sm:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-purple">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Address ({selectedDoctor.distance} km away)</p>
                    <p className="font-medium">{selectedDoctor.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <button 
                  onClick={() => onBookConsultation(selectedDoctor)}
                  className="flex-1 min-w-[200px] py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={20} />
                  Book Consultation
                </button>
                <button className="flex-1 min-w-[200px] py-4 rounded-2xl glass border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold">
                  <Phone size={20} className="text-brand-pink" />
                  Call Now
                </button>
                <button 
                  className="flex-1 min-w-[200px] py-4 rounded-2xl glass border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedDoctor.lat},${selectedDoctor.lng}`, '_blank')}
                >
                  <Navigation size={20} className="text-brand-blue" />
                  Get Directions
                </button>
              </div>

              {/* Real Google Map */}
              <div className="w-full">
                <iframe
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: '12px', marginTop: '16px' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps?q=${selectedDoctor.lat || 18.5074},${selectedDoctor.lng || 73.8077}&output=embed`}
                ></iframe>
                <div className="mt-4 flex justify-center">
                  <a 
                    href={`https://www.google.com/maps?q=${selectedDoctor.lat || 18.5074},${selectedDoctor.lng || 73.8077}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-brand-blue font-bold hover:underline"
                  >
                    🧭 Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NearbyDoctors;
