import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, AlertTriangle, ShieldCheck, 
  CheckCircle2, Info, ArrowRight, X, Bug, Zap 
} from 'lucide-react';
import { POULTRY_DISEASES } from '../data/diseaseData';

export default function Diseases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedDisease, setSelectedDisease] = useState(null);

  // Filtering Logic
  const filteredDiseases = POULTRY_DISEASES.filter(disease => {
    const matchesSearch = 
      disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disease.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disease.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disease.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || disease.category === categoryFilter;
    const matchesSeverity = severityFilter === 'All' || disease.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="h-4 w-4 text-amber-500" />
            <span>Avian Health Knowledgebase</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">Poultry Disease Directory</h1>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Comprehensive reference guide for viral, bacterial, and parasitic poultry infections, symptoms, and veterinary treatments.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search disease name, symptom (e.g. bloody droppings, twisted neck)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">All Pathogen Types</option>
                <option value="Viral">Viral Diseases</option>
                <option value="Bacterial">Bacterial Diseases</option>
                <option value="Parasitic">Parasitic Diseases</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">All Severity Levels</option>
                <option value="Critical">Critical Severity</option>
                <option value="High">High Severity</option>
                <option value="Moderate">Moderate Severity</option>
              </select>
            </div>

          </div>
        </div>

        {/* Diseases Grid */}
        {filteredDiseases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDiseases.map((disease) => (
              <div
                key={disease.id}
                onClick={() => setSelectedDisease(disease)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 shadow-sm hover:shadow-md space-y-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{disease.name}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 italic block">{disease.scientificName}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                      disease.severity === 'Critical'
                        ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                        : disease.severity === 'High'
                        ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {disease.severity}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                      {disease.category}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">Mortality: <strong className="text-slate-800 dark:text-slate-200">{disease.mortalityRate}</strong></span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {disease.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View Treatment & Biosecurity Protocol</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm">
            <Bug className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Diseases Matched Your Search</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Try adjusting your keyword query or resetting filter categories.</p>
          </div>
        )}

      </div>

      {/* DISEASE DETAIL MODAL OVERLAY */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-8 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{selectedDisease.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    selectedDisease.severity === 'Critical' ? 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40' : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                  }`}>
                    {selectedDisease.severity} Severity
                  </span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 italic block mt-1">{selectedDisease.scientificName}</span>
              </div>

              <button
                onClick={() => setSelectedDisease(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-2 rounded-xl cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Pathogen Category</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{selectedDisease.category}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Mortality Rate</span>
                <strong className="text-amber-600 dark:text-amber-400 font-bold text-sm">{selectedDisease.mortalityRate}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Incubation Period</span>
                <strong className="text-slate-900 dark:text-slate-200 font-bold text-sm">{selectedDisease.incubationPeriod}</strong>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Full Pathology Description</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{selectedDisease.description}</p>
            </div>

            {/* Transmission */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">Transmission Vectors:</span>
              <p className="text-xs text-slate-700 dark:text-slate-300">{selectedDisease.transmission}</p>
            </div>

            {/* Symptoms & Treatment Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Symptoms */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Clinical Symptoms</span>
                </h3>
                <ul className="space-y-2">
                  {selectedDisease.symptoms.map((s, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                      <span className="text-amber-500 font-bold shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prevention */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-teal-500" />
                  <span>Biosecurity & Prevention</span>
                </h3>
                <ul className="space-y-2">
                  {selectedDisease.prevention.map((p, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                      <span className="text-teal-500 font-bold shrink-0">✔</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Treatment Protocol */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Veterinary Treatment Protocol</span>
              </h3>
              <ul className="space-y-2">
                {selectedDisease.treatment.map((t, idx) => (
                  <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">[+]</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
