import React, { useState } from 'react';
import { 
  Stethoscope, Upload, Video, Activity, AlertTriangle, CheckCircle2, 
  Sparkles, RefreshCw, ShieldAlert, FileText, ArrowRight, PlayCircle, Camera, Clock, Eye, Layers
} from 'lucide-react';
import { POULTRY_DISEASES, SYMPTOM_CHECKLIST } from '../data/diseaseData';

export default function Diagnosis() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' | 'symptoms' | 'video'

  // --- Image Diagnosis States ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageResult, setImageResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Symptom Diagnosis States ---
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomResults, setSymptomResults] = useState([]);

  // --- Video Diagnosis States ---
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoResult, setVideoResult] = useState(null);
  const [videoErrorMsg, setVideoErrorMsg] = useState(null);
  const [selectedKeyframe, setSelectedKeyframe] = useState(null);

  // -------------------------------------------------------------
  // Image Upload Handlers & API Call
  // -------------------------------------------------------------
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageResult(null);
      setErrorMsg(null);
    }
  };

  const handleImageDiagnosis = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setErrorMsg(null);
    setImageResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      let response;
      try {
        response = await fetch('/predict', { method: 'POST', body: formData });
        if (!response.ok && response.status === 404) throw new Error('Not found');
      } catch {
        response = await fetch('http://localhost:5000/predict', { method: 'POST', body: formData });
      }

      if (!response.ok) {
        throw new Error(`Server status ${response.status}: Failed to process prediction.`);
      }

      const resData = await response.json();
      if (resData.status === 'success' && resData.data) {
        setImageResult(resData.data);
      } else {
        throw new Error(resData.error || 'Invalid API response format.');
      }
    } catch (err) {
      console.warn('API Error or server offline:', err);
      setErrorMsg('Error connecting to Hugging Face backend model at http://localhost:5000. Please start Flask app.py.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Symptom Selection Handlers & Algorithmic Matcher
  // -------------------------------------------------------------
  const toggleSymptom = (symptomId) => {
    let updated;
    if (selectedSymptoms.includes(symptomId)) {
      updated = selectedSymptoms.filter(id => id !== symptomId);
    } else {
      updated = [...selectedSymptoms, symptomId];
    }
    setSelectedSymptoms(updated);
    calculateSymptomMatches(updated);
  };

  const calculateSymptomMatches = (currentSymptoms) => {
    if (currentSymptoms.length === 0) {
      setSymptomResults([]);
      return;
    }

    const scores = {};
    const matchedSymptomMap = {};

    POULTRY_DISEASES.forEach(disease => {
      scores[disease.id] = 0;
      matchedSymptomMap[disease.id] = [];
    });

    SYMPTOM_CHECKLIST.forEach(cat => {
      cat.items.forEach(item => {
        if (currentSymptoms.includes(item.id)) {
          Object.entries(item.weight).forEach(([diseaseId, w]) => {
            if (scores[diseaseId] !== undefined) {
              scores[diseaseId] += w;
              matchedSymptomMap[diseaseId].push(item.label);
            }
          });
        }
      });
    });

    const maxPossibleScore = currentSymptoms.length * 5;
    
    const results = POULTRY_DISEASES.map(disease => {
      const score = scores[disease.id] || 0;
      const matched = matchedSymptomMap[disease.id] || [];
      const matchPercentage = Math.min(Math.round((score / Math.max(maxPossibleScore, 10)) * 100 * 2.2), 99);
      
      return {
        disease,
        score,
        matchedSymptoms: matched,
        matchPercentage
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

    setSymptomResults(results);
  };

  // -------------------------------------------------------------
  // Video Upload Handlers & API Call
  // -------------------------------------------------------------
  const handleVideoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setVideoResult(null);
      setVideoErrorMsg(null);
      setSelectedKeyframe(null);
    }
  };

  const handleVideoDiagnosis = async () => {
    if (!videoFile) return;

    setVideoLoading(true);
    setVideoErrorMsg(null);
    setVideoResult(null);
    setSelectedKeyframe(null);

    const formData = new FormData();
    formData.append('file', videoFile);

    try {
      let response;
      try {
        response = await fetch('/predict_video', { method: 'POST', body: formData });
        if (!response.ok && response.status === 404) throw new Error('Not found');
      } catch {
        response = await fetch('http://localhost:5000/predict_video', { method: 'POST', body: formData });
      }

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const resData = await response.json();
      if (resData.status === 'success' && resData.data) {
        setVideoResult(resData.data);
      } else {
        throw new Error(resData.error || 'Failed to process video diagnosis');
      }
    } catch (err) {
      console.error('Video Diagnosis Error:', err);
      setVideoErrorMsg('Error connecting to backend video detection server at http://localhost:5000. Please ensure python app.py is running.');
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>PoulCare Neural Vision Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">Poultry Disease Diagnosis Portal</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">
            Powered by <span className="font-bold text-emerald-600 dark:text-emerald-400">PoulCare-YOLOv11 Vision AI</span> (26 Clinical Lesion Classes). Upload photo for image AI, upload video for temporal detection, or use the interactive symptom checker.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex space-x-2 max-w-2xl w-full shadow-sm">
            
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Image AI Diagnosis</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Video className="h-4 w-4" />
              <span>Video Detection AI</span>
            </button>

            <button
              onClick={() => setActiveTab('symptoms')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'symptoms'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>Symptom Checker</span>
            </button>

          </div>
        </div>

        {/* TAB 1: IMAGE-BASED AI DIAGNOSIS */}
        {activeTab === 'image' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            
            <div className="bg-white dark:bg-slate-900/80 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500/60 rounded-3xl p-8 text-center transition-all duration-300 shadow-sm hover:shadow-md">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {!imagePreview ? (
                <label htmlFor="photo-upload" className="cursor-pointer space-y-4 block">
                  <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <Upload className="h-10 w-10" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white block">Click to upload poultry lesion or bird photo</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm mt-1 block">Detects 26 clinical lesions (JPG, PNG, JPEG) via PoulCare Vision AI</span>
                  </div>
                </label>
              ) : (
                <div className="space-y-6">
                  <div className="relative max-w-md mx-auto">
                    <img
                      src={imageResult?.annotated_image_base64 || imagePreview}
                      alt="Uploaded Poultry Preview"
                      className="w-full max-h-80 object-contain rounded-2xl border-2 border-emerald-500/40 shadow-xl bg-slate-900"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                        setImageResult(null);
                        setErrorMsg(null);
                      }}
                      className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white rounded-full p-1.5 shadow-lg text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <button
                    onClick={handleImageDiagnosis}
                    disabled={loading}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Running PoulCare Vision AI Neural Net...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span>Analyze Photo With PoulCare AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Image Result Card */}
            {imageResult && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg space-y-6 animate-fadeIn">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>PoulCare AI Vision Output</span>
                    </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{imageResult.disease_name}</h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Model: <code className="bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">{imageResult.model_source}</code>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Confidence Score</div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{imageResult.confidence_percentage}%</div>
                    </div>

                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      imageResult.severity === 'Critical'
                        ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                        : imageResult.severity === 'High'
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {imageResult.severity} Severity
                    </span>
                  </div>
                </div>

                {/* Detected Lesion Bounding Boxes List */}
                {imageResult.detections && imageResult.detections.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-emerald-500" />
                      <span>Detected Lesion Bounding Boxes ({imageResult.detections.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {imageResult.detections.map((det, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{det.class_name}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">BBox: [{det.bbox.join(', ')}]</span>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-1 rounded-lg">
                            {det.confidence}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Class Probabilities Bar */}
                {imageResult.class_probabilities && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">Neural Network Disease Probability Distribution</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(imageResult.class_probabilities).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span className="capitalize font-medium">{key === 'cocci' ? 'Coccidiosis' : key === 'ncd' ? 'Newcastle Disease' : key === 'fowlpox' ? 'Fowlpox' : 'Healthy'}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{val}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Clinical Summary</span>
                  </h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{imageResult.description}</p>
                </div>

                {/* Symptoms & Treatment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Symptoms */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Associated Symptoms & Lesions</span>
                    </h3>
                    <ul className="space-y-2">
                      {(imageResult.symptoms || []).map((symptom, idx) => (
                        <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                          <span className="text-amber-500 shrink-0">•</span>
                          <span>{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Treatment */}
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Veterinary Protocol & Action Plan</span>
                    </h3>
                    <ul className="space-y-2">
                      {(imageResult.recommended_treatment || []).map((action, idx) => (
                        <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                          <span className="text-emerald-500 font-bold shrink-0">✔</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 2: VIDEO-BASED AI DIAGNOSIS */}
        {activeTab === 'video' && (
          <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
            
            {/* Model Info Header */}
            <div className="bg-gradient-to-r from-teal-900/30 via-slate-900 to-emerald-900/30 border border-teal-500/40 p-6 rounded-3xl flex items-start space-x-4 shadow-sm text-white">
              <PlayCircle className="h-8 w-8 text-teal-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold">PoulCare Video Temporal Object Detection Active</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Extracts video frames, runs real-time object detection using <code className="text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded font-mono">PoulCare-YOLOv11 Vision Engine</code>, overlays bounding boxes on detected lesion keyframes, and builds a temporal timeline.
                </p>
              </div>
            </div>

            {/* Video File Upload Dropzone */}
            <div className="bg-white dark:bg-slate-900/80 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-teal-500/60 rounded-3xl p-8 text-center transition-all duration-300 shadow-sm">
              <input
                type="file"
                id="video-upload"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />

              {!videoPreview ? (
                <label htmlFor="video-upload" className="cursor-pointer space-y-4 block">
                  <div className="h-20 w-20 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400">
                    <Camera className="h-10 w-10" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white block">Upload Poultry Motion Video or Farm Pen Recording</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm mt-1 block">Supports MP4, MOV, AVI, WEBM</span>
                  </div>
                </label>
              ) : (
                <div className="space-y-6 max-w-xl mx-auto">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-72 object-contain rounded-2xl border-2 border-teal-500/40 shadow-xl bg-black"
                  />
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreview(null);
                        setVideoResult(null);
                        setVideoErrorMsg(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline cursor-pointer"
                    >
                      Remove Video
                    </button>

                    <button
                      onClick={handleVideoDiagnosis}
                      disabled={videoLoading}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      {videoLoading ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Decomposing Frames & Running YOLO Detection...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          <span>Analyze Video With PoulCare AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {videoErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{videoErrorMsg}</span>
              </div>
            )}

            {/* Video Results Card */}
            {videoResult && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-lg space-y-8 animate-fadeIn">
                
                {/* Header Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
                  <div>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <Activity className="h-3.5 w-3.5" />
                      <span>Temporal Video AI Analysis Output</span>
                    </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{videoResult.disease_name}</h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Model Engine: <code className="bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded font-mono">{videoResult.model_architecture}</code>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Overall Video Confidence</div>
                      <div className="text-2xl font-black text-teal-600 dark:text-teal-400">{videoResult.confidence_percentage}%</div>
                    </div>

                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      videoResult.severity === 'Critical'
                        ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                        : videoResult.severity === 'High'
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {videoResult.severity} Severity
                    </span>
                  </div>
                </div>

                {/* Video Specs Metrics */}
                {videoResult.video_metadata && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Duration</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">{videoResult.video_metadata.duration_seconds}s</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Analyzed Frames</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">{videoResult.video_metadata.sampled_frames_analyzed}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Total Detections</div>
                      <div className="text-base font-bold text-teal-600 dark:text-teal-400">{videoResult.total_detections_in_video}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">FPS / Resolution</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">{videoResult.video_metadata.fps} FPS ({videoResult.video_metadata.resolution})</div>
                    </div>
                  </div>
                )}

                {/* Keyframe Snapshots Gallery with Bounding Boxes */}
                {videoResult.keyframe_snapshots && videoResult.keyframe_snapshots.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <Camera className="h-4 w-4 text-teal-500" />
                        <span>Detected Lesion Keyframe Snapshots ({videoResult.keyframe_snapshots.length})</span>
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Click snapshot to enlarge</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {videoResult.keyframe_snapshots.map((kf, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedKeyframe(kf)}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 space-y-2 cursor-pointer hover:border-teal-500/60 transition-all duration-200 shadow-sm"
                        >
                          <div className="relative">
                            <img
                              src={kf.image_base64}
                              alt={`Keyframe at ${kf.timestamp}`}
                              className="w-full h-36 object-cover rounded-xl bg-black"
                            />
                            <span className="absolute top-2 left-2 bg-slate-900/80 text-white font-mono text-[10px] px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-teal-400" />
                              <span>{kf.timestamp}</span>
                            </span>
                            <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {kf.top_confidence}% conf
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {kf.lesions.map((l, lIdx) => (
                              <span key={lIdx} className="bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyframe Modal View */}
                {selectedKeyframe && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedKeyframe(null)}>
                    <div className="bg-slate-900 border border-slate-700 max-w-3xl w-full p-6 rounded-3xl space-y-4 text-white" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-teal-400" />
                          <span className="font-bold">Keyframe Timestamp: {selectedKeyframe.timestamp}</span>
                        </div>
                        <button onClick={() => setSelectedKeyframe(null)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
                      </div>
                      <img src={selectedKeyframe.image_base64} alt="Enlarged Keyframe" className="w-full max-h-[60vh] object-contain rounded-2xl bg-black border border-slate-800" />
                      <div className="flex flex-wrap gap-2">
                        {selectedKeyframe.lesions.map((l, i) => (
                          <span key={i} className="bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs px-3 py-1 rounded-full font-bold">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Temporal Timeline */}
                {videoResult.temporal_timeline && videoResult.temporal_timeline.length > 0 && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-teal-500" />
                      <span>Temporal Detection Log Timeline</span>
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {videoResult.temporal_timeline.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 rounded">
                              {entry.timestamp}
                            </span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {entry.lesions.map(l => l.class_name).join(', ')}
                            </span>
                          </div>
                          <span className="font-extrabold text-teal-600 dark:text-teal-400">
                            {entry.top_confidence}% conf
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disease Probabilities Distribution */}
                {videoResult.class_probabilities && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">Aggregate Video Disease Probability</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(videoResult.class_probabilities).map(([key, val]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span className="capitalize font-medium">{key === 'cocci' ? 'Coccidiosis' : key === 'ncd' ? 'Newcastle Disease' : key === 'fowlpox' ? 'Fowlpox' : 'Healthy'}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{val}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${val}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description & Treatment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Observed Symptoms</span>
                    </h3>
                    <ul className="space-y-2">
                      {(videoResult.symptoms || []).map((symptom, idx) => (
                        <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                          <span className="text-amber-500 shrink-0">•</span>
                          <span>{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 p-5 rounded-2xl space-y-3">
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Veterinary Protocol & Treatment</span>
                    </h3>
                    <ul className="space-y-2">
                      {(videoResult.recommended_treatment || []).map((action, idx) => (
                        <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                          <span className="text-emerald-500 font-bold shrink-0">✔</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 3: SYMPTOMS-BASED DIAGNOSIS */}
        {activeTab === 'symptoms' && (
          <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Interactive Symptom Checklist</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Check all clinical signs observed in your flock. Our algorithm calculates match probabilities in real time.</p>
              </div>

              <div className="space-y-8">
                {SYMPTOM_CHECKLIST.map((cat, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{cat.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cat.items.map((item) => {
                        const checked = selectedSymptoms.includes(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                              checked
                                ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500/50 text-slate-900 dark:text-white font-semibold'
                                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSymptom(item.id)}
                              className="h-4 w-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Symptom Diagnosis Results */}
            {symptomResults.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Matching Diseases ({symptomResults.length})</h2>

                <div className="grid grid-cols-1 gap-6">
                  {symptomResults.map(({ disease, matchPercentage, matchedSymptoms }) => (
                    <div key={disease.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{disease.name}</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              disease.severity === 'Critical' ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30' : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}>
                              {disease.severity}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5 block">{disease.scientificName}</span>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-500 dark:text-slate-400">Match Probability</div>
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{matchPercentage}%</div>
                        </div>
                      </div>

                      {/* Matched Symptoms Badges */}
                      <div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">Matched Symptoms:</span>
                        <div className="flex flex-wrap gap-2">
                          {matchedSymptoms.map((sym, idx) => (
                            <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs px-2.5 py-1 rounded-lg">
                              ✔ {sym}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{disease.shortDescription}</p>

                      {/* Action Plan */}
                      <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Immediate Veterinary Protocol:</span>
                        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {disease.treatment.slice(0, 2).map((t, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-emerald-500">•</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
