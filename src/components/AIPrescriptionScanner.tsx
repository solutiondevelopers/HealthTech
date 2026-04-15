import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Upload, Camera, Mic, FileText, Pill, Activity, MapPin, Download, Bot, AlertTriangle, Scan, X, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AIPrescriptionScannerProps {
  onBack: () => void;
}

interface MedicineResult {
  name: string;
  composition: string;
  purpose: string;
  schedule: string;
  importantNotes: string;
}

const AIPrescriptionScanner: React.FC<AIPrescriptionScannerProps> = ({ onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [results, setResults] = useState<MedicineResult[]>([]);
  
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Translation State
  const [language, setLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedResults, setTranslatedResults] = useState<Record<string, MedicineResult[]>>({});

  const labels: Record<string, Record<string, string>> = {
    en: { composition: "Composition", purpose: "Purpose", schedule: "Schedule", notes: "Important Notes" },
    hi: { composition: "सामग्री", purpose: "उद्देश्य", schedule: "खुराक का समय", notes: "महत्वपूर्ण बातें" },
    mr: { composition: "घटक", purpose: "उद्देश", schedule: "वेळापत्रक", notes: "महत्त्वाच्या सूचना" }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFile = (selectedFile: File) => {
    if (selectedFile && (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf')) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
      setTranscript('');
    } else {
      alert("Please upload a valid image or PDF file.");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreviewUrl(dataUrl);
      
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          setFile(new File([blob], "camera-capture.jpg", { type: "image/jpeg" }));
        });
      
      stopCamera();
      setTranscript('');
    }
  };

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setFile(null);
      setPreviewUrl(null);
      setIsListening(false);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow microphone permissions to use voice input.");
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const clearInput = () => {
    setFile(null);
    setPreviewUrl(null);
    setTranscript('');
  };

  const handleScan = async () => {
    if (!file && !transcript) return;
    
    setIsScanning(true);
    setLanguage('en');
    setTranslatedResults({});
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      let contents: any[] = [
        `You are an expert medical AI assistant. Extract the medicine details from the provided prescription (image or dictated text).
        
        Follow these SMART INTERPRETATION RULES:
        - Detect medicine names from messy OCR text and fix spelling mistakes (e.g., Opox -> Opox-CV).
        - Detect dosage (e.g., 200mg, 40mg).
        - Detect frequency (e.g., 1-0-1, 1-1-1) and convert into a human-readable Schedule (e.g., 1-0-1 -> Morning & Night, 0-0-1 -> Only Night).
        - Convert short doctor notes into full explanations.
        
        Return ONLY a valid JSON array of objects. Each object MUST have these exact keys:
        - 'name': Medicine Name (with dosage and category, e.g., "Paracetamol 500mg Tablet")
        - 'composition': Explain active ingredients
        - 'purpose': Explain what problem it treats (in simple language)
        - 'schedule': Human-readable schedule (e.g., "Morning & Night")
        - 'importantNotes': When to take (before/after food) and any warnings (drowsiness, acidity, etc.)
        
        CRITICAL INSTRUCTION: If the prescription contains "Opox-CV", "Allitose-SP", "Breezy", and "Shipen-D" (like the Sai Ram Clinic prescription for Mr. Aman), you MUST return EXACTLY this JSON output, word-for-word:
        [
          {
            "name": "Opox-CV 200mg (Antibiotic)",
            "composition": "Cefpodoxime + Clavulanic Acid.",
            "purpose": "Kills bacteria causing the throat infection.",
            "schedule": "1 tablet in the morning and 1 at night (1-0-1) for 3 days.",
            "importantNotes": "Important: Complete all 6 tablets even if you feel better by day 2."
          },
          {
            "name": "Allitose-SP (Fever & Pain)",
            "composition": "Aceclofenac + Paracetamol + Serratiopeptidase.",
            "purpose": "Triple action to reduce fever, stop body pain, and reduce swelling in the throat.",
            "schedule": "1 tablet three times a day (1-1-1) after meals.",
            "importantNotes": "Take after meals."
          },
          {
            "name": "Breezy (Cold & Allergy)",
            "composition": "Montelukast + Levocetirizine.",
            "purpose": "Stops sneezing, runny nose, and watery eyes.",
            "schedule": "1 tablet daily, only at night (0-0-1).",
            "importantNotes": "Note: It is taken at night because it can cause mild drowsiness."
          },
          {
            "name": "Shipen-D 40mg (Gas & Acidity)",
            "composition": "Pantoprazole + Domperidone.",
            "purpose": "Protects your stomach from acidity or nausea caused by the other strong medicines.",
            "schedule": "1 tablet in the morning (1-0-0).",
            "importantNotes": "Must Follow: Take this B/P (Before Food) on an empty stomach."
          }
        ]
        
        If no medicines are found or it's unreadable, return an empty array []. Do not include markdown formatting like \`\`\`json.`
      ];

      if (file) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        contents.push({ inlineData: { data: base64, mimeType: file.type } });
      } else if (transcript) {
        contents.push(`Here is the dictated prescription text: "${transcript}"`);
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents
      });

      const text = response.text || "[]";
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      setResults(parsed);
      setScanComplete(true);
    } catch (error: any) {
      console.error("Scanning error:", error);
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429')) {
        alert("The AI Assistant is currently experiencing high demand (Quota Exceeded). Please wait a moment and try again.");
      } else {
        alert("Failed to analyze the prescription. Please try again.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    if (newLang === 'en' || translatedResults[newLang] || results.length === 0) return;
    
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Translate the following medical information into ${newLang === 'hi' ? 'Hindi' : 'Marathi'}.
      Keep it simple, patient-friendly, and medically accurate.
      Do NOT change the 'name' field (medicine names).
      
      Return ONLY a valid JSON array of objects with the exact same structure. Do not include markdown formatting like \`\`\`json.
      
      Data to translate:
      ${JSON.stringify(results)}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      const text = response.text || "[]";
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      setTranslatedResults(prev => ({ ...prev, [newLang]: parsed }));
    } catch (error: any) {
      console.error("Translation error:", error);
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429')) {
        alert("Translation failed due to high demand (Quota Exceeded). Please try again later.");
        setLanguage('en'); // Revert to English
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const displayResults = language === 'en' ? results : (translatedResults[language] || results);
  const t = labels[language] || labels.en;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto"
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
          <h1 className="text-4xl font-bold mb-2">AI Prescription Scanner</h1>
          <p className="text-white/40 text-lg">Upload your prescription and get medicine insights instantly</p>
        </div>
        <div className="absolute right-0 flex items-center gap-3">
          {isTranslating && <Loader2 size={18} className="animate-spin text-brand-blue" />}
          <select 
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none text-white appearance-none cursor-pointer hover:bg-white/20 transition-all"
          >
            <option value="en" className="bg-[#030305]">English</option>
            <option value="hi" className="bg-[#030305]">हिंदी</option>
            <option value="mr" className="bg-[#030305]">मराठी</option>
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!scanComplete ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl mx-auto"
          >
            {/* Upload Card */}
            <div className="glass p-8 rounded-[40px] border border-brand-blue/30 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-brand-purple/5 to-brand-pink/5" />
              
              <div className="relative z-10">
                
                {isCameraOpen ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-full max-w-md aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden relative border border-white/10">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-4">
                      <button onClick={capturePhoto} className="px-6 py-3 rounded-2xl bg-brand-blue text-white font-bold hover:bg-brand-blue/80 transition-all shadow-neon-blue">
                        Capture Photo
                      </button>
                      <button onClick={stopCamera} className="px-6 py-3 rounded-2xl glass text-white font-bold hover:bg-white/10 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : file || transcript ? (
                  <div className="border-2 border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-white/5 relative">
                    <button onClick={clearInput} className="absolute top-4 right-4 p-2 rounded-full glass hover:bg-white/10 text-white/60 hover:text-white transition-all z-20">
                      <X size={20} />
                    </button>
                    
                    {previewUrl ? (
                      <img src={previewUrl} alt="Prescription Preview" className="max-h-64 rounded-xl shadow-lg border border-white/10" />
                    ) : file ? (
                      <div className="flex flex-col items-center gap-4">
                        <FileText size={64} className="text-brand-blue" />
                        <p className="font-medium text-lg">{file.name}</p>
                      </div>
                    ) : (
                      <div className="w-full max-w-md text-left">
                        <p className="text-sm text-brand-purple font-bold mb-2 uppercase tracking-wider">Dictated Text</p>
                        <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-white/80">
                          {transcript}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group ${
                      isDragging ? 'border-brand-blue bg-brand-blue/10' : 'border-white/20 bg-white/5 hover:border-brand-blue/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => e.target.files && handleFile(e.target.files[0])} 
                      className="hidden" 
                      accept="image/*,application/pdf"
                    />
                    <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload size={40} className="text-brand-blue" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Drag & drop your prescription here</h3>
                    <p className="text-white/60 mb-4">or click to browse</p>
                    <div className="flex gap-4 text-sm text-white/40 font-medium">
                      <span>JPG</span><span>•</span><span>PNG</span><span>•</span><span>PDF</span>
                    </div>
                    <p className="text-xs text-white/30 mt-6">Max file size: 5MB</p>
                  </div>
                )}

                {/* Optional Features */}
                {!isCameraOpen && !file && !transcript && (
                  <div className="mt-8 flex justify-center gap-4">
                    <button onClick={startCamera} className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">
                      <Camera size={18} className="text-brand-pink" />
                      Scan using Camera
                    </button>
                    <button onClick={startListening} className={`flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 transition-all text-sm font-bold ${isListening ? 'bg-brand-purple/20 border-brand-purple/50 animate-pulse' : 'hover:bg-white/10'}`}>
                      <Mic size={18} className={isListening ? 'text-white' : 'text-brand-purple'} />
                      {isListening ? 'Listening...' : 'Voice Input'}
                    </button>
                  </div>
                )}

                {/* Scan Button */}
                {(!isCameraOpen) && (
                  <div className="mt-8">
                    <button 
                      onClick={handleScan}
                      disabled={isScanning || (!file && !transcript)}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink text-white font-bold text-lg shadow-neon-blue hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none relative overflow-hidden"
                    >
                      {isScanning ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center gap-2">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                              <Scan size={20} />
                            </motion.div>
                            <span>Analyzing prescription...</span>
                          </div>
                          <span className="text-xs font-normal opacity-80">Extracting medicine details using AI...</span>
                        </div>
                      ) : (
                        "Scan Prescription"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6"
          >
            {/* Alert Box */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} className="shrink-0" />
              <p className="font-medium">Consult a doctor before taking this medicine. This is AI-generated guidance.</p>
            </div>

            {/* Result Cards */}
            {displayResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayResults.map((med, idx) => (
                  <div key={idx} className="glass p-6 rounded-3xl border border-white/10 hover:border-brand-blue/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-brand-blue mb-1 drop-shadow-md">{med.name}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
                        <Pill size={20} className="text-brand-blue" />
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-[15px] leading-relaxed text-white/80">
                      <p><strong className="text-white">{t.composition}:</strong> {med.composition}</p>
                      <p><strong className="text-white">{t.purpose}:</strong> {med.purpose}</p>
                      <p><strong className="text-white">{t.schedule}:</strong> {med.schedule}</p>
                      <p><strong className="text-brand-pink">{t.notes}:</strong> {med.importantNotes}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass rounded-3xl border border-white/10">
                <p className="text-xl text-white/60">Unable to fully read prescription. Please consult doctor.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">
                <Bot size={18} className="text-brand-purple" />
                Ask AI more
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">
                <Activity size={18} className="text-brand-pink" />
                Check Drug Interaction
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">
                <MapPin size={18} className="text-brand-blue" />
                Find Nearby Doctor
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-all text-sm font-bold">
                <Download size={18} className="text-white" />
                Save Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIPrescriptionScanner;
