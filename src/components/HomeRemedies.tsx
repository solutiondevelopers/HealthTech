import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, Leaf, Wind, Droplets, Sparkles, Shield, Bot, AlertTriangle, Coffee, Flame, X } from 'lucide-react';

interface HomeRemediesProps {
  onBack: () => void;
  onAskAI: (query: string) => void;
}

type Category = 'Cold & Cough' | 'Digestion' | 'Skin Care' | 'Immunity';

interface Remedy {
  name: string;
  description: string;
  icon: React.ReactNode;
  detailedInfo?: {
    intro: string;
    activeIngredient: string;
    science: string;
    bestFor: string;
    ingredients: string[];
    instructions: string[];
  };
}

const remediesData: Record<Category, Remedy[]> = {
  'Cold & Cough': [
    { 
      name: 'Turmeric Milk (Haldi Doodh)', 
      description: 'Warm milk with turmeric and black pepper boosts immunity and reduces cough.', 
      icon: <Coffee className="text-brand-pink" />,
      detailedInfo: {
        intro: 'Known as "Golden Milk," this is a powerful systemic remedy used for building immunity and reducing internal inflammation.',
        activeIngredient: 'Curcumin (found in Turmeric).',
        science: 'Curcumin is anti-inflammatory but poorly absorbed by the human body. Adding Black Pepper increases its absorption by up to 2000%, while the Fats in milk help it dissolve and enter the bloodstream.',
        bestFor: 'Nighttime recovery, dry cough, body aches, and general immunity.',
        ingredients: [
          '1 cup Milk (Dairy or plant-based)',
          '1/2 tsp Turmeric powder',
          '1 pinch Black Pepper (Cracked)',
          '1/2 inch Cinnamon stick (Optional)',
          '1 tsp Honey or Jaggery (Added at the end)'
        ],
        instructions: [
          'Pour milk into a saucepan and bring to a light simmer.',
          'Whisk in turmeric, black pepper, and cinnamon.',
          'Simmer on low heat for 5 minutes to activate the curcumin.',
          'Strain into a cup.',
          'Allow to cool slightly before adding honey (high heat kills honey\'s beneficial enzymes).'
        ]
      }
    },
    { 
      name: 'Ginger and Honey', 
      description: 'Ginger juice + honey helps sore throat and wet cough.', 
      icon: <Droplets className="text-brand-blue" />,
      detailedInfo: {
        intro: 'A potent "spot treatment" for the respiratory tract that provides immediate relief to the throat lining.',
        activeIngredient: 'Gingerol (found in Ginger).',
        science: 'Gingerol acts as a bronchodilator (opens airways) and a mucolytic (breaks down phlegm). Honey acts as a demulcent, creating a physical barrier over irritated throat tissues to stop the cough reflex.',
        bestFor: 'Productive (wet) cough, sore throat, and clearing chest congestion.',
        ingredients: [
          '1-inch piece of Fresh Ginger root',
          '1 tbsp Raw Honey',
          '2-3 drops of Lemon juice (Optional for Vitamin C)'
        ],
        instructions: [
          'Extract Juice: Grate the ginger root finely. Use a tea strainer or muslin cloth to squeeze the pulp and extract 1 tsp of pure ginger juice.',
          'Combine: Mix the ginger juice thoroughly with 1 tbsp of raw honey in a small bowl.',
          'Warm (Indirectly): Place the small bowl inside a larger bowl of hot water for 2 minutes to warm the mixture gently.',
          'Dosage: Swallow 1 teaspoon of the mixture slowly. Let it coat the throat.',
          'Post-Care: Avoid drinking water for 20–30 minutes after consumption to allow the honey coating to stay in place.'
        ]
      }
    },
    { name: 'Kadha (Herbal Decoction)', description: 'Tulsi, ginger, pepper, cloves, cinnamon boiled in water.', icon: <Flame className="text-brand-purple" /> },
    { name: 'Ajwain Steam', description: 'Steam inhalation clears nasal congestion.', icon: <Wind className="text-brand-blue" /> },
    { name: 'Salt Water Gargle', description: 'Warm salt water kills bacteria and reduces throat pain.', icon: <Droplets className="text-brand-pink" /> },
    { name: 'Sunth Goli', description: 'Ginger candy with jaggery helps in winter cough.', icon: <Leaf className="text-brand-purple" /> },
  ],
  'Digestion': [
    { name: 'Ajwain + Salt', description: 'Relieves gas and indigestion.', icon: <Leaf className="text-brand-blue" /> },
    { name: 'Hing (Asafoetida)', description: 'Helps bloating and stomach pain.', icon: <Sparkles className="text-brand-pink" /> },
    { name: 'Fennel Seeds (Saunf)', description: 'Improves digestion after meals.', icon: <Leaf className="text-brand-purple" /> },
    { name: 'Ginger Tea', description: 'Aids digestion and removes toxins.', icon: <Coffee className="text-brand-blue" /> },
    { name: 'Buttermilk + Curry Leaves', description: 'Useful for diarrhea and stomach upset.', icon: <Droplets className="text-brand-pink" /> },
  ],
  'Skin Care': [
    { name: 'Oil Massage (Abhyanga)', description: 'Nourishes skin and improves blood circulation.', icon: <Droplets className="text-brand-purple" /> },
    { name: 'Besan Bath', description: 'Natural cleanser that removes dead skin cells.', icon: <Sparkles className="text-brand-blue" /> },
    { name: 'Aloe Vera', description: 'Soothes skin, reduces acne, and hydrates naturally.', icon: <Leaf className="text-brand-pink" /> },
    { name: 'Curd Hair Pack', description: 'Conditions hair and helps remove dandruff.', icon: <Droplets className="text-brand-purple" /> },
    { name: 'Saffron + Milk', description: 'Improves skin complexion and adds a natural glow.', icon: <Coffee className="text-brand-blue" /> },
  ],
  'Immunity': [
    { name: 'Giloy', description: 'Powerful antioxidant that boosts immunity and fights fevers.', icon: <Leaf className="text-brand-pink" /> },
    { name: 'Amla', description: 'Rich in Vitamin C, excellent for overall wellness and immunity.', icon: <Sparkles className="text-brand-blue" /> },
    { name: 'Tulsi', description: 'Holy basil helps fight respiratory infections and stress.', icon: <Leaf className="text-brand-purple" /> },
    { name: 'Nutmeg (Jaiphal)', description: 'Improves sleep quality and boosts immunity.', icon: <Sparkles className="text-brand-pink" /> },
    { name: 'Almonds', description: 'Rich in Vitamin E and healthy fats for brain and body strength.', icon: <Leaf className="text-brand-blue" /> },
  ]
};

const categories: Category[] = ['Cold & Cough', 'Digestion', 'Skin Care', 'Immunity'];

const HomeRemedies: React.FC<HomeRemediesProps> = ({ onBack, onAskAI }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Cold & Cough');
  const [selectedRemedy, setSelectedRemedy] = useState<Remedy | null>(null);

  // Filter remedies based on search query or active category
  const filteredRemedies = searchQuery.trim() !== '' 
    ? Object.values(remediesData).flat().filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : remediesData[activeCategory];

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
          <h1 className="text-4xl font-bold mb-2">Home Remedies</h1>
          <p className="text-white/40 text-lg">Find safe and natural remedies based on your symptoms</p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="mb-10 space-y-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text" 
            placeholder="Enter your symptom (e.g., cold, cough, stomach pain)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all placeholder:text-white/20 text-lg"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSearchQuery('');
              }}
              className={`px-6 py-3 rounded-full border transition-all font-medium text-sm flex items-center gap-2 ${
                activeCategory === cat && searchQuery === ''
                  ? 'bg-brand-blue/20 border-brand-blue text-white shadow-neon-blue'
                  : 'glass border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'Cold & Cough' && <Wind size={16} />}
              {cat === 'Digestion' && <Coffee size={16} />}
              {cat === 'Skin Care' && <Sparkles size={16} />}
              {cat === 'Immunity' && <Shield size={16} />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        <AnimatePresence mode="popLayout">
          {filteredRemedies.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredRemedies.map((remedy, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={remedy.name}
                  onClick={() => setSelectedRemedy(remedy)}
                  className="glass p-6 rounded-3xl border border-white/10 hover:border-brand-blue/30 transition-all flex flex-col h-full group cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {remedy.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 leading-tight">{remedy.name}</h3>
                    </div>
                  </div>
                  
                  <p className="text-white/70 text-[15px] leading-relaxed flex-1 mb-6">
                    {remedy.description}
                  </p>

                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAI(`Tell me more about the home remedy: ${remedy.name} for ${activeCategory}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 transition-colors text-sm font-bold"
                    >
                      <Bot size={16} />
                      Ask AI
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAI(`What are the safety precautions for using ${remedy.name}?`);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-pink/10 text-brand-pink hover:bg-brand-pink/20 transition-colors text-sm font-bold"
                    >
                      <AlertTriangle size={16} />
                      Safety Info
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 glass rounded-3xl border border-white/10"
            >
              <Leaf size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-xl text-white/60">No remedies found for "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-brand-blue hover:underline"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Safety Note */}
      <div className="mt-6 p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center gap-3 text-brand-blue/80 text-sm font-medium">
        <Shield size={18} />
        <p>These remedies are traditional and for mild conditions. Consult a doctor for serious symptoms.</p>
      </div>

      {/* Remedy Details Modal */}
      <AnimatePresence>
        {selectedRemedy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRemedy(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto custom-scrollbar glass p-8 rounded-[40px] border border-white/10 relative"
            >
              <button onClick={() => setSelectedRemedy(null)} className="absolute top-6 right-6 p-2 rounded-full glass hover:bg-white/10 text-white/60 hover:text-white transition-all">
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                  {selectedRemedy.icon}
                </div>
                <h2 className="text-3xl font-bold text-white">{selectedRemedy.name}</h2>
              </div>

              {selectedRemedy.detailedInfo ? (
                <div className="space-y-8 text-white/80">
                  <p className="text-lg leading-relaxed text-white/90">{selectedRemedy.detailedInfo.intro}</p>
                  
                  <div className="p-5 rounded-2xl bg-brand-pink/5 border border-brand-pink/20">
                    <p><strong className="text-brand-pink">Primary Active Ingredient:</strong> {selectedRemedy.detailedInfo.activeIngredient}</p>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-brand-blue mb-3">The Science</h4>
                    <p className="leading-relaxed">{selectedRemedy.detailedInfo.science}</p>
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-brand-purple mb-3">Best Used For</h4>
                    <p className="leading-relaxed">{selectedRemedy.detailedInfo.bestFor}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Leaf size={18} className="text-brand-pink"/> Ingredients</h4>
                      <ul className="space-y-3">
                        {selectedRemedy.detailedInfo.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-pink mt-1.5 shrink-0" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Flame size={18} className="text-brand-purple"/> Instructions</h4>
                      <ol className="space-y-4">
                        {selectedRemedy.detailedInfo.instructions.map((inst, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="font-bold text-brand-purple shrink-0">{i + 1}.</span>
                            {inst}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-xl text-white/60 mb-8">{selectedRemedy.description}</p>
                  <button 
                    onClick={() => {
                      setSelectedRemedy(null);
                      onAskAI(`Tell me the detailed recipe and science behind ${selectedRemedy.name}`);
                    }}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-bold hover:scale-105 transition-all shadow-neon-blue"
                  >
                    Ask AI for Detailed Recipe
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HomeRemedies;
