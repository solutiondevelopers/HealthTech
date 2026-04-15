import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, MapPin, Phone, Navigation, Clock, Pill, X, Crosshair, Star, User, Briefcase } from 'lucide-react';

interface MedicineStoreLocatorProps {
  onBack: () => void;
}

interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  distance: number; // in km
  lat: number;
  lon: number;
  tags: string[];
  isOpen: boolean;
  city: string;
  rating: number;
  yearsInBusiness: number;
  specialization: string;
  ownerName: string;
}

const mockStores: Store[] = [
  { id: 1, name: 'Sanjeevani Medical', address: 'Karve Road, Kothrud', phone: '+91 98230 12345', distance: 0.5, lat: 18.5084, lon: 73.8087, tags: ['Pharmacy', '24x7'], isOpen: true, city: 'Pune', rating: 4.8, yearsInBusiness: 15, specialization: 'Allopathy & General', ownerName: 'Rajesh Joshi' },
  { id: 2, name: 'Patanjali Chikitsalaya', address: 'Paud Road, Kothrud', phone: 'Not Available', distance: 1.2, lat: 18.5054, lon: 73.8097, tags: ['Ayurvedic'], isOpen: true, city: 'Pune', rating: 4.5, yearsInBusiness: 8, specialization: 'Ayurvedic Medicines', ownerName: 'Amit Deshmukh' },
  { id: 3, name: 'Jan Aushadhi Kendra', address: 'Dahanukar Colony, Kothrud', phone: '+91 99220 54321', distance: 1.8, lat: 18.5104, lon: 73.8067, tags: ['Generic'], isOpen: true, city: 'Pune', rating: 4.2, yearsInBusiness: 3, specialization: 'Generic Medicines', ownerName: 'Suresh Patil' },
  { id: 4, name: 'Wellness Forever', address: 'Kothrud Stand', phone: '+91 88000 11223', distance: 0.8, lat: 18.5064, lon: 73.8057, tags: ['Pharmacy', '24x7'], isOpen: true, city: 'Pune', rating: 4.6, yearsInBusiness: 5, specialization: 'Pharmacy & FMCG', ownerName: 'Corporate' },
  { id: 5, name: 'Shree Medical', address: 'Mayur Colony, Kothrud', phone: '+91 77550 99887', distance: 2.1, lat: 18.5114, lon: 73.8107, tags: ['Pharmacy'], isOpen: false, city: 'Pune', rating: 4.0, yearsInBusiness: 20, specialization: 'Prescription Drugs', ownerName: 'Vijay Kadam' },
  { id: 6, name: 'AyurCare Pharmacy', address: 'Bhusari Colony, Kothrud', phone: 'Not Available', distance: 2.5, lat: 18.5044, lon: 73.8047, tags: ['Ayurvedic', 'Generic'], isOpen: true, city: 'Pune', rating: 4.3, yearsInBusiness: 10, specialization: 'Ayurvedic & Generic', ownerName: 'Neha Sharma' },
];

const MedicineStoreLocator: React.FC<MedicineStoreLocatorProps> = ({ onBack }) => {
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Filter and sort stores
  const filteredStores = mockStores
    .filter(store => {
      if (!location.trim()) return true;
      return store.city.toLowerCase().includes(location.toLowerCase()) || 
             store.address.toLowerCase().includes(location.toLowerCase());
    })
    .sort((a, b) => a.distance - b.distance);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
      setSelectedStore(null);
    }, 600);
  };

  const handleUseMyLocation = () => {
    setLocation('Pune'); // Mocking geolocation to Pune for demo
    handleSearch();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center mb-8 relative">
        <button 
          onClick={onBack}
          className="absolute left-0 p-3 rounded-xl glass hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="w-full text-center">
          <h1 className="text-4xl font-bold mb-2">Medicine Store Locator</h1>
          <p className="text-white/40 text-lg">Find nearby pharmacies and generic medicine stores</p>
        </div>
      </div>

      {/* Location Input Section */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 max-w-3xl mx-auto w-full">
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text" 
            placeholder="Enter your location (e.g., Pune, Mumbai)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20 text-lg"
          />
        </div>
        <button 
          onClick={handleSearch}
          className="px-8 py-4 rounded-2xl bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-all shadow-neon-blue flex items-center justify-center gap-2"
        >
          <Search size={20} />
          Search
        </button>
        <button 
          onClick={handleUseMyLocation}
          className="px-6 py-4 rounded-2xl glass border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Crosshair size={20} className="text-brand-pink" />
          Use My Location
        </button>
      </div>

      {/* Main Content Area */}
      {hasSearched && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Store List */}
          <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-8">
            <h3 className="text-xl font-bold text-white/80 mb-2">Nearby Stores</h3>
            {filteredStores.length > 0 ? (
              filteredStores.map((store, idx) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedStore(store)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group ${
                    selectedStore?.id === store.id 
                      ? 'bg-brand-blue/10 border-brand-blue shadow-neon-blue' 
                      : 'glass border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-bold text-lg ${selectedStore?.id === store.id ? 'text-brand-blue' : 'text-white group-hover:text-brand-blue'} transition-colors`}>
                      {store.name}
                    </h4>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-bold text-brand-pink bg-brand-pink/10 px-2 py-1 rounded-lg">
                        {store.distance} km
                      </span>
                      <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
                        <Star size={12} className="fill-yellow-500" /> {store.rating}
                      </span>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-3 line-clamp-1">{store.address}</p>
                  <div className="flex flex-wrap gap-2">
                    {store.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-white/40 bg-white/5 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${store.isOpen ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {store.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 glass rounded-2xl border border-white/10">
                <MapPin size={40} className="mx-auto text-white/20 mb-4" />
                <p className="text-white/60">No stores found in this area.</p>
              </div>
            )}
          </div>

          {/* Store Detail & Map Panel */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6 h-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {selectedStore ? (
                <motion.div
                  key={selectedStore.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col h-full gap-6"
                >
                  {/* Detail Card */}
                  <div className="glass p-6 rounded-3xl border border-brand-blue/30 shadow-neon-blue relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 blur-[50px] rounded-full" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{selectedStore.name}</h2>
                        <div className="flex items-center gap-2 text-white/60">
                          <MapPin size={16} />
                          <p>{selectedStore.address}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl font-bold text-sm ${selectedStore.isOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {selectedStore.isOpen ? 'Open Now' : 'Closed'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Star size={12}/> Rating</p>
                        <p className="font-bold text-yellow-500 text-lg">{selectedStore.rating} / 5</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin size={12}/> Distance</p>
                        <p className="font-bold text-brand-pink text-lg">{selectedStore.distance} km</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 col-span-2">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Phone size={12}/> Phone</p>
                        <p className="font-bold text-white text-lg">{selectedStore.phone}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 col-span-2">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Briefcase size={12}/> Specialization</p>
                        <p className="font-bold text-white text-sm">{selectedStore.specialization}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={12}/> Experience</p>
                        <p className="font-bold text-white text-sm">{selectedStore.yearsInBusiness} Years</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><User size={12}/> Owner</p>
                        <p className="font-bold text-white text-sm line-clamp-1">{selectedStore.ownerName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <a 
                        href={`tel:${selectedStore.phone.replace(/\s/g, '')}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-colors"
                      >
                        <Phone size={18} />
                        Call Now
                      </a>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.lat},${selectedStore.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-purple text-white font-bold hover:bg-brand-purple/90 transition-colors"
                      >
                        <Navigation size={18} />
                        Get Directions
                      </a>
                      <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass border border-white/20 text-white font-bold hover:bg-white/10 transition-colors">
                        <Pill size={18} className="text-brand-pink" />
                        Check Availability
                      </button>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="flex-1 glass rounded-3xl border border-white/10 overflow-hidden relative min-h-[300px]">
                    <iframe 
                      title="Store Location Map"
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${selectedStore.lat},${selectedStore.lon}&z=15&output=embed`}
                      className="absolute inset-0 w-full h-full filter invert-[90%] hue-rotate-180 contrast-80" // CSS trick to make map dark mode
                    />
                    {/* Map Overlay for styling */}
                    <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-3xl shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 glass rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <MapPin size={40} className="text-brand-blue/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Select a Store</h3>
                  <p className="text-white/40 max-w-md">Click on any store from the list to view its details, get directions, and see it on the map.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MedicineStoreLocator;
