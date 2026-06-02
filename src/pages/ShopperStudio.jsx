import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { recommendSize, classifyProportions } from '../utils/poseUtils';
import { fetchTryOn, fetchStyleAdvice } from '../services/api';
import { db, seedFirestoreIfEmpty } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import SwapDrawer from '../components/SwapDrawer';
import PdfPreviewModal from '../components/PdfPreviewModal';
import Loader from '../components/Loader';
import { 
  Camera, UploadCloud, RefreshCw, Sliders, Sparkles, 
  Layers, Cpu, FileText, ChevronRight, CheckCircle, 
  HelpCircle, ArrowLeft, Ruler, AlertCircle
} from 'lucide-react';

const ShopperStudio = () => {
  const { logout, currentUser } = useAuth();
  const { isReady: poseReady, loading: poseLoading, analyzeImage, drawSkeleton } = useMediaPipe();

  // Fitting Studio States
  const [step, setStep] = useState(1); // 1: Upload/Calibrate, 2: Occasion/Outfits
  const [uploadedImage, setUploadedImage] = useState(null); // base64
  const [imageFile, setImageFile] = useState(null);
  const [analyzingPose, setAnalyzingPose] = useState(false);
  const [poseAnalysis, setPoseAnalysis] = useState(null);
  
  // Calibration Sliders
  const [shoulderSlider, setShoulderSlider] = useState(88);
  const [waistSlider, setWaistSlider] = useState(78);
  const [hipSlider, setHipSlider] = useState(92);
  const [bodyShape, setBodyShape] = useState('Rectangle');
  const [shapeExplanation, setShapeExplanation] = useState('');

  // Shopping States
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Current Outfit Selection
  const [currentOutfit, setCurrentOutfit] = useState({
    Top: null,
    Bottom: null,
    Footwear: null,
    Accessory: null
  });

  // Try-On & Styling Advice states
  const [tryOnImage, setTryOnImage] = useState(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [stylingAdvice, setStylingAdvice] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [activeView, setActiveView] = useState('tryon'); // 'tryon' or 'skeleton'

  // Modal / Drawer toggles
  const [swapOpen, setSwapOpen] = useState(false);
  const [swapCategory, setSwapCategory] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // DOM Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const occasionsList = [
    { name: 'Wedding', icon: '💝' },
    { name: 'Casual', icon: '☕' },
    { name: 'Formal', icon: '👔' },
    { name: 'Party', icon: '🥂' },
    { name: 'Interview', icon: '💼' }
  ];

  // Fetch products from Firestore on load and seed if empty
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        await seedFirestoreIfEmpty(); // ensure sample items are seeded
        
        const productsCol = collection(db, 'products');
        const snapshot = await getDocs(productsCol);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(list);
        console.log(`[ShopperStudio] Loaded ${list.length} products from Firestore.`);
      } catch (err) {
        console.error('[ShopperStudio] Failed to retrieve products from Firestore:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Update canvas with landmarks when poseAnalysis changes in Step 1
  useEffect(() => {
    if (uploadedImage && poseAnalysis && canvasRef.current && step === 1) {
      const canvas = canvasRef.current;
      const img = new Image();
      img.src = uploadedImage;
      img.onload = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.width * (4/3);
        drawSkeleton(canvas, img, poseAnalysis);
      };
    }
  }, [uploadedImage, poseAnalysis, step]);

  // Redraw canvas/overlay in Step 2 when currentOutfit changes
  useEffect(() => {
    if (uploadedImage && canvasRef.current && step === 2 && activeView === 'skeleton') {
      const canvas = canvasRef.current;
      const img = new Image();
      img.src = uploadedImage;
      img.onload = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.width * (4/3);
        drawSkeleton(canvas, img, poseAnalysis);
      };
    }
  }, [uploadedImage, currentOutfit, step, activeView, poseAnalysis]);

  // Handle local file uploads
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setUploadedImage(base64);
      setTryOnImage(null);
      setStylingAdvice('');
      
      // Auto trigger pose analysis
      runPoseAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  // Run MediaPipe Vision Scanner
  const runPoseAnalysis = async (base64) => {
    setAnalyzingPose(true);
    setPoseAnalysis(null);

    try {
      const img = new Image();
      img.src = base64;
      await new Promise(resolve => img.onload = resolve);
      
      const analysis = await analyzeImage(img);
      setPoseAnalysis(analysis);
      
      // Set sliders from output
      setShoulderSlider(analysis.measurements.shoulderWidth);
      setWaistSlider(analysis.measurements.waistWidth);
      setHipSlider(analysis.measurements.hipWidth);
      setBodyShape(analysis.shape.shape);
      setShapeExplanation(analysis.shape.explanation);
    } catch (error) {
      console.warn('[ShopperStudio] MediaPipe failed, running manual calibration:', error);
      
      // Fallback: default average Rectangle proportions
      const fallbackAnalysis = {
        measurements: { shoulderWidth: 88, waistWidth: 78, hipWidth: 92, height: 170 },
        shape: { 
          shape: 'Rectangle', 
          explanation: 'Body scanner fallback. Adjust the sliders manually to match your body widths.' 
        },
        landmarks: null
      };
      setPoseAnalysis(fallbackAnalysis);
      setShoulderSlider(88);
      setWaistSlider(78);
      setHipSlider(92);
      setBodyShape('Rectangle');
      setShapeExplanation(fallbackAnalysis.shape.explanation);
    } finally {
      setAnalyzingPose(false);
    }
  };

  // Update shape details when sliders are adjusted
  const handleSliderChange = (type, val) => {
    let s = shoulderSlider;
    let w = waistSlider;
    let h = hipSlider;

    if (type === 'shoulder') {
      setShoulderSlider(val);
      s = val;
    } else if (type === 'waist') {
      setWaistSlider(val);
      w = val;
    } else if (type === 'hip') {
      setHipSlider(val);
      h = val;
    }

    // Convert values back to widths and classify
    const classS = parseFloat(s) / 2.2;
    const classW = parseFloat(w) / 2.2;
    const classH = parseFloat(h) / 2.2;

    const classified = classifyProportions(classS, classW, classH);
    setBodyShape(classified.shape);
    setShapeExplanation(classified.explanation);

    // Update measurements in state
    setPoseAnalysis(prev => ({
      ...prev,
      measurements: {
        ...prev?.measurements,
        shoulderWidth: parseInt(s),
        waistWidth: parseInt(w),
        hipWidth: parseInt(h)
      },
      shape: classified
    }));
  };

  // Clear upload and restart
  const handleRemovePhoto = () => {
    setUploadedImage(null);
    setImageFile(null);
    setPoseAnalysis(null);
    setStep(1);
    setSelectedOccasion(null);
    setTryOnImage(null);
    setStylingAdvice('');
    setCurrentOutfit({ Top: null, Bottom: null, Footwear: null, Accessory: null });
  };

  // Select shopping occasion and match products
  const handleSelectOccasion = (occasionName) => {
    setSelectedOccasion(occasionName);
    setTryOnImage(null); // Reset tryon when occasion shifts
    
    // Size recommended for filter
    const generalSize = recommendSize(poseAnalysis?.measurements || {}, 'General').letter;

    // Matching products filter pipeline
    const matchForCategory = (category) => {
      // 1. Filter by category & matching occasion (singular occasion or array-contains)
      let matches = products.filter(p => 
        p.category === category && 
        (p.occasion === occasionName || (p.occasions && p.occasions.includes(occasionName)))
      );
      
      // 2. Filter by recommended silhouette shapes
      let shapeMatches = matches.filter(p => p.shapes && p.shapes.includes(bodyShape));
      if (shapeMatches.length > 0) {
        matches = shapeMatches;
      }

      // 3. Filter by recommended size if products specify size arrays
      let sizeMatches = matches.filter(p => p.sizes && p.sizes.includes(generalSize));
      if (sizeMatches.length > 0) {
        matches = sizeMatches;
      }

      // Fallbacks to avoid empty outfit slot
      if (matches.length === 0) {
        matches = products.filter(p => 
          p.category === category && 
          (p.occasion === occasionName || (p.occasions && p.occasions.includes(occasionName)))
        );
      }
      if (matches.length === 0) {
        matches = products.filter(p => p.category === category);
      }

      return matches[0] || null;
    };

    const top = matchForCategory('Top');
    const bottom = matchForCategory('Bottom');
    const footwear = matchForCategory('Footwear');
    const accessory = matchForCategory('Accessory');

    const matchedOutfit = { Top: top, Bottom: bottom, Footwear: footwear, Accessory: accessory };
    setCurrentOutfit(matchedOutfit);

    // Transition to next screen
    setStep(2);
    setActiveView('tryon');

    // Run AI Styling advice in parallel
    triggerAIStylingAdvice(matchedOutfit, occasionName);
  };

  // Fetch Groq styling advice
  const triggerAIStylingAdvice = async (outfit, occasionName) => {
    try {
      setAdviceLoading(true);
      setStylingAdvice('Consulting your AI Personal Stylist...');
      const res = await fetchStyleAdvice(bodyShape, occasionName, outfit);
      setStylingAdvice(res.advice);
    } catch (err) {
      console.warn('[ShopperStudio] Groq styling failed, running fallback advice.');
      setStylingAdvice('Your selected clothing coordinating features balance proportions beautifully. High necklines pull focus upward, pairing nicely with straight hemlines.');
    } finally {
      setAdviceLoading(false);
    }
  };

  // Trigger Replicate Virtual Try-On securely
  const triggerVirtualTryOn = async (item) => {
    if (!item) return;
    
    // Virtual Try-on is only supported for Top and Bottom categories
    if (item.category !== 'Top' && item.category !== 'Bottom') {
      alert('Virtual Try-on is supported for Tops and Bottoms only.');
      return;
    }

    try {
      setTryOnLoading(true);
      
      // Determine Tryon Category
      const tryonCat = item.category === 'Top' ? 'upper_body' : 'lower_body';
      
      console.log(`[ShopperStudio] Calling tryon on server for item ${item.name}`);
      const res = await fetchTryOn(
        uploadedImage, 
        item.imageUrl, 
        item.name, 
        tryonCat
      );

      setTryOnImage(res.imageUrl);
      setActiveView('tryon');
    } catch (error) {
      console.error('[ShopperStudio] Try-on operation failed:', error);
      alert('AI Try-on service encountered an error. Swapping preview to fallback visual.');
      // Fail back to Unsplash stylized tryon fallback image
      setTryOnImage('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80');
      setActiveView('tryon');
    } finally {
      setTryOnLoading(false);
    }
  };

  // Open Swap side drawer
  const openSwap = (category) => {
    setSwapCategory(category);
    setSwapOpen(true);
  };

  // Swap out garment and trigger styling/tryon updates
  const handleSwapSelect = (newGarment) => {
    const updatedOutfit = { ...currentOutfit, [swapCategory]: newGarment };
    setCurrentOutfit(updatedOutfit);
    setSwapOpen(false);
    
    // Reset try-on image since outfit changed, and request new styling advice
    setTryOnImage(null);
    triggerAIStylingAdvice(updatedOutfit, selectedOccasion);
  };

  // Compute recommended fit details for display
  const generalSize = poseAnalysis ? recommendSize(poseAnalysis.measurements, 'General') : { letter: 'M', numeric: 38 };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 font-inter">
        
        {/* --- STEP 1: UPLOAD & CALIBRATION --- */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left: Drag Drop Input / Canvas Preview */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <h2 className="text-xl font-outfit font-bold flex items-center gap-2 text-gold border-b border-dark-border pb-3 mb-6">
                <Camera className="h-5 w-5" />
                <span>1. Silhouette Upload</span>
              </h2>

              {!uploadedImage ? (
                // Drag Drop Zone
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-dark-border hover:border-gold/40 rounded-xl py-16 px-6 text-center cursor-pointer hover:bg-white/5 transition-all group relative"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <UploadCloud className="h-12 w-12 text-dark-muted group-hover:text-gold mx-auto mb-4 transition-colors" />
                  <h3 className="font-outfit font-semibold text-lg text-white mb-1">Drag & Drop Silhouette Photo</h3>
                  <p className="text-xs text-dark-muted mb-4 max-w-xs mx-auto">
                    Supports JPG, PNG, or WEBP formats. For high accuracy, use a front-facing standing photo.
                  </p>
                  <button type="button" className="glass-panel border-dark-border py-2 px-5 rounded-lg text-xs font-semibold text-white group-hover:border-gold/30 transition-all">
                    Browse Files
                  </button>
                </div>
              ) : (
                // Image Canvas preview and removal trigger
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-dark-border bg-dark-bg/60">
                    <canvas ref={canvasRef} className="w-full h-auto block" />
                    
                    {analyzingPose && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"></div>
                        <p className="text-sm font-semibold tracking-wide">Mapping landmarks...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center gap-3">
                    <button 
                      onClick={handleRemovePhoto} 
                      className="border border-rose hover:bg-rose-light/10 text-rose py-2 px-4 rounded-xl text-xs font-semibold font-outfit transition-all"
                    >
                      Remove Photo
                    </button>
                    <button 
                      onClick={() => runPoseAnalysis(uploadedImage)}
                      className="glass-panel border-dark-border hover:bg-white/5 text-white py-2 px-4 rounded-xl text-xs font-semibold font-outfit transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Re-analyze</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Manual adjustment sliders */}
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-xl font-outfit font-bold flex items-center gap-2 text-rose border-b border-dark-border pb-3 mb-6">
                  <Sliders className="h-5 w-5" />
                  <span>2. Calibrate Proportions</span>
                </h2>

                {!poseAnalysis ? (
                  <div className="text-center py-12 text-dark-muted text-sm leading-relaxed">
                    Upload a standing portrait above to automatically calculate body proportions.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-dark-border p-4 rounded-xl">
                      <div>
                        <span className="text-[10px] text-dark-muted font-semibold uppercase tracking-wider block">Estimated Silhouette</span>
                        <span className="text-gold font-outfit font-bold text-lg">{bodyShape}</span>
                      </div>
                      <span className="text-xs bg-gold-light border border-gold/25 text-gold py-1 px-3 rounded-full font-semibold font-inter">
                        EU Size: {generalSize.letter}
                      </span>
                    </div>
                    
                    <p className="text-xs text-dark-muted font-inter leading-relaxed">
                      {shapeExplanation} Feel free to adjust the sliders manually if the landmarks mapped incorrectly.
                    </p>

                    <div className="space-y-4">
                      {/* Shoulder Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-dark-muted">Shoulder Width</span>
                          <span className="text-white">{shoulderSlider} cm</span>
                        </div>
                        <input 
                          type="range" 
                          min="30" 
                          max="150" 
                          value={shoulderSlider} 
                          onChange={(e) => handleSliderChange('shoulder', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Waist Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-dark-muted">Waist Width</span>
                          <span className="text-white">{waistSlider} cm</span>
                        </div>
                        <input 
                          type="range" 
                          min="30" 
                          max="150" 
                          value={waistSlider} 
                          onChange={(e) => handleSliderChange('waist', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Hip Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-dark-muted">Hip Width</span>
                          <span className="text-white">{hipSlider} cm</span>
                        </div>
                        <input 
                          type="range" 
                          min="30" 
                          max="150" 
                          value={hipSlider} 
                          onChange={(e) => handleSliderChange('hip', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Event Occasion selection */}
              {poseAnalysis && (
                <div className="glass-panel rounded-2xl p-6">
                  <h2 className="text-xl font-outfit font-bold flex items-center gap-2 text-gold border-b border-dark-border pb-3 mb-6">
                    <Sparkles className="h-5 w-5" />
                    <span>3. Choose Styling Event</span>
                  </h2>
                  <p className="text-xs text-dark-muted mb-6 leading-relaxed">
                    Select the target dress code occasion. FitStyle matches appropriate silhouettes and coordinates.
                  </p>

                  <div className="grid grid-cols-5 gap-3">
                    {occasionsList.map((oc) => (
                      <button
                        key={oc.name}
                        onClick={() => handleSelectOccasion(oc.name)}
                        className="glass-panel border-dark-border hover:border-gold/30 hover:bg-gold-light/10 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                      >
                        <span className="text-2xl group-hover:scale-110 transition-transform">{oc.icon}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-dark-muted group-hover:text-gold transition-colors">
                          {oc.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- STEP 2: DYNAMIC OUTFITS & TRY-ON --- */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Column 1 (Left 5 grid spans): Viewport */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass-panel rounded-2xl p-4">
                <div className="canvas-viewport relative">
                  {activeView === 'tryon' && (tryOnImage || !poseAnalysis?.landmarks) ? (
                    <img 
                      src={tryOnImage || uploadedImage} 
                      alt="User Fitting Result" 
                      className="w-full h-full object-cover block"
                    />
                  ) : (
                    <canvas ref={canvasRef} className="w-full h-full object-cover block" />
                  )}

                  {tryOnLoading && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center text-center p-4">
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold mx-auto"></div>
                        <p className="text-white text-sm font-semibold font-outfit">AI Try-On rendering...</p>
                        <p className="text-dark-muted text-xs font-inter max-w-[200px]">Generating virtual fit using IDM-VTON (10-30s delay)</p>
                      </div>
                    </div>
                  )}

                  {/* recommended size overlay */}
                  <div className="absolute bottom-4 left-4 glass-panel border-gold/20 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-gold">
                    <Ruler className="h-3.5 w-3.5 text-gold" />
                    <span>Fit Size: {generalSize.letter}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="glass-panel border-dark-border hover:bg-white/5 text-white py-2.5 px-4 rounded-xl text-sm font-semibold font-outfit flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Re-Calibrate</span>
                  </button>

                  <button
                    onClick={() => setPdfOpen(true)}
                    className="bg-gold hover:bg-gold-hover text-black py-2.5 px-4 rounded-xl text-sm font-semibold font-outfit flex items-center justify-center gap-1.5 transition-all shadow-lg transform active:scale-95"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download Summary</span>
                  </button>
                </div>
              </div>

              {/* Selector for viewport visual (tryon vs skeleton landmarks) */}
              {poseAnalysis?.landmarks && (
                <div className="glass-panel border-dark-border rounded-xl p-2.5 flex items-center justify-between text-xs font-semibold">
                  <span className="text-dark-muted pl-1.5">Viewport Visual Angle:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveView('tryon')}
                      className={`py-1.5 px-3.5 rounded-lg transition-colors ${
                        activeView === 'tryon' ? 'bg-gold text-black' : 'text-dark-muted hover:text-white'
                      }`}
                    >
                      AI Fit Image
                    </button>
                    <button
                      onClick={() => setActiveView('skeleton')}
                      className={`py-1.5 px-3.5 rounded-lg transition-colors ${
                        activeView === 'skeleton' ? 'bg-gold text-black' : 'text-dark-muted hover:text-white'
                      }`}
                    >
                      Landmark Points
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Column 2 (Right 7 grid spans): Match Tiles & AI style box */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex justify-between items-center border-b border-dark-border pb-3 mb-6">
                  <h2 className="text-xl font-outfit font-bold flex items-center gap-2 text-gold">
                    <Layers className="h-5 w-5" />
                    <span>Recommended Dress Coordination</span>
                  </h2>
                  <span className="text-xs bg-rose-light text-rose border border-rose/15 rounded-full py-1 px-3 font-semibold uppercase tracking-wider font-inter">
                    {selectedOccasion}
                  </span>
                </div>

                {/* Outfit Category Items Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['Top', 'Bottom', 'Footwear', 'Accessory'].map((category) => {
                    const item = currentOutfit[category];
                    const itemSize = poseAnalysis ? recommendSize(poseAnalysis.measurements, category) : { letter: 'M' };
                    
                    if (!item) {
                      return (
                        <div key={category} className="glass-panel border-dashed border-dark-border rounded-xl p-4 flex flex-col items-center justify-center text-center h-[200px]">
                          <AlertCircle className="h-8 w-8 text-dark-muted mb-2" />
                          <span className="text-xs text-dark-muted font-semibold uppercase tracking-wider block">{category}</span>
                          <span className="text-sm font-outfit font-medium mt-1">Item Unavailable</span>
                        </div>
                      );
                    }

                    const isTryOnSupported = category === 'Top' || category === 'Bottom';

                    return (
                      <div key={category} className="glass-panel border-dark-border rounded-xl overflow-hidden flex flex-col group hover:border-gold/25 transition-all">
                        {/* Garment Image */}
                        <div className="relative aspect-[4/3] bg-dark-bg/60 overflow-hidden border-b border-dark-border">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute top-2.5 left-2.5 bg-dark-bg/85 backdrop-blur-sm border border-dark-border text-white text-[10px] font-bold tracking-wider py-1 px-2.5 rounded-full uppercase">
                            Size {itemSize.letter}
                          </span>
                        </div>

                        {/* Garment Details & Actions */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider">{category}</span>
                            <h4 className="text-sm font-semibold font-outfit text-white leading-snug line-clamp-1 mt-0.5" title={item.name}>
                              {item.name}
                            </h4>
                          </div>
                          
                          <div className="flex justify-between items-center gap-2 mt-4 pt-3 border-t border-dark-border/40">
                            <span className="text-xs text-gold font-bold font-inter">${parseFloat(item.price).toFixed(2)}</span>
                            <div className="flex gap-2">
                              {isTryOnSupported && (
                                <button
                                  onClick={() => triggerVirtualTryOn(item)}
                                  disabled={tryOnLoading}
                                  className="bg-gold-light border border-gold/25 hover:bg-gold/15 text-gold text-xs font-semibold py-1.5 px-3 rounded-lg font-outfit transition-all disabled:opacity-50"
                                >
                                  Try On
                                </button>
                              )}
                              <button
                                onClick={() => openSwap(category)}
                                className="glass-panel border-dark-border hover:bg-white/5 text-white text-xs font-semibold py-1.5 px-3 rounded-lg font-outfit transition-all flex items-center gap-1"
                              >
                                <RefreshCw className="h-3 w-3 shrink-0" />
                                <span>Swap</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Styling advice explanation box */}
              <div className="glass-panel-gold rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="h-5 w-5 text-gold" />
                  <h3 className="text-lg font-outfit font-bold text-white">AI Stylist Rationale</h3>
                </div>

                {adviceLoading ? (
                  <div className="flex items-center gap-2.5 text-xs text-dark-muted font-inter">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                    <span>Consulting AI Styling model...</span>
                  </div>
                ) : (
                  <p className="text-sm text-dark-muted leading-relaxed font-inter">
                    {stylingAdvice || 'No styling advice generated.'}
                  </p>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Dynamic Swapping Drawer */}
      <SwapDrawer
        isOpen={swapOpen}
        category={swapCategory}
        items={products.filter(p => p.category === swapCategory)}
        selectedItem={currentOutfit[swapCategory]}
        onClose={() => setSwapOpen(false)}
        onSelect={handleSwapSelect}
      />

      {/* PDF styling invoice download modal */}
      <PdfPreviewModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        canvasSnapshot={tryOnImage || uploadedImage}
        bodyShape={bodyShape}
        sizeRecommend={generalSize}
        occasion={selectedOccasion}
        outfitItems={currentOutfit}
        adviceText={stylingAdvice}
      />

      {/* Loader icon animations */}
      {poseLoading && (
        <Loader 
          message="Preparing landmarks scanner..." 
          submessage="Downloading body proportion vision tasks from cloud dependencies" 
          overlay 
        />
      )}
    </div>
  );
};

// Simple rotation loader icon component
const Loader2 = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default ShopperStudio;
