import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, ShieldCheck, BookOpen, Sparkles, Wind, Utensils, 
  ShieldAlert, Eye, Thermometer, CheckCircle2, AlertTriangle, ArrowRight 
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('housing');

  const maintenancePillars = [
    {
      id: 'housing',
      title: 'Housing & Ventilation',
      icon: Wind,
      shortDesc: 'Optimal airflow, litter moisture control, and micro-climate regulation.',
      details: [
        'Maintain litter moisture between 20% - 25%. Replace wet bedding under drinkers immediately to stop Coccidiosis oocyst sporulation.',
        'Ensure continuous ridge and sidewall ventilation to keep ammonia gas levels below 15 ppm.',
        'Maintain stocking density: 1.0 - 1.2 sq.ft per broiler bird and 2.0 sq.ft per layer bird.',
        'Monitor temperature: 32°C (Day 1 chicks), reducing by 2.5°C weekly until reaching 21°C ambient.'
      ]
    },
    {
      id: 'nutrition',
      title: 'Nutrition & Clean Water',
      icon: Utensils,
      shortDesc: 'Balanced amino acids, clean water access, and digestive health.',
      details: [
        'Provide clean, chlorinated drinking water (2-3 ppm free chlorine). Water consumption is 2x feed intake.',
        'Broiler Starter: 22-23% Crude Protein; Finisher: 19-20% CP. Layer diets require 3.5-4.0% Calcium for eggshell strength.',
        'Flush water lines with hydrogen peroxide or citric acid acidifiers weekly to eliminate bacterial biofilm.',
        'Keep feed troughs elevated to shoulder height of birds to minimize feed spillage and mold growth.'
      ]
    },
    {
      id: 'biosecurity',
      title: 'Biosecurity & Hygiene',
      icon: ShieldAlert,
      shortDesc: 'Strict farm entrance sanitation, footbaths, and disease exclusion.',
      details: [
        'Place Virkon S or Iodine footbaths at every house entrance; change disinfectant solutions every 48 hours.',
        'Enforce strict visitor restrictions and vehicle wheel disinfection before farm gate entry.',
        'Net all window openings with fine mesh to prevent wild migratory bird contact (primary Avian Flu vector).',
        'Follow "All-In, All-Out" flock management with a minimum 14-day downtime & deep wash between batches.'
      ]
    },
    {
      id: 'inspection',
      title: 'Flock Health Inspection',
      icon: Eye,
      shortDesc: 'Daily morning observations of droppings, comb color, and respiratory sounds.',
      details: [
        'Inspect droppings early morning: Firm brownish droppings with white urate caps indicate optimal digestive health.',
        'Listen for night tracheal rales, sneezing, or gurgling sounds when the house is quiet.',
        'Check comb and wattle color: Bright red indicates active circulation; pale indicates anemia/coccidiosis; purple indicates cyanosis.',
        'Isolate birds showing lethargy, wing drooping, or vent pasting in a separate quarantine pen immediately.'
      ]
    },
    {
      id: 'brooding',
      title: 'Brooding & Climate Control',
      icon: Thermometer,
      shortDesc: 'Chick warmth ring management, radiant brooders, and starter feeding.',
      details: [
        'Pre-heat brooder house 24 hours prior to chick arrival so floor temperature reaches 30-32°C.',
        'Observe chick distribution: Even spread = perfect warmth; huddling under heater = too cold; crowding walls = too hot.',
        'Provide paper feeding sheets covering 50% of brooder area with crumble feed for the first 3 days.',
        'Add electrolyte and Vitamin C anti-stress formulas to drinking water during chick transit arrival.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-16 sm:py-24">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>AI-Powered Poultry Healthcare Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Smart Poultry Management & <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">AI Disease Diagnosis</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Diagnose poultry diseases instantly using trained vision models, calculate symptom probabilities, monitor multi-batch vaccination schedules, and explore biosecurity guidelines.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/diagnosis"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-all duration-200 text-base"
              >
                <Stethoscope className="h-5 w-5" />
                <span>Start AI Diagnosis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              
              <Link
                to="/vaccines"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold px-8 py-4 rounded-xl shadow-sm transition-all duration-200 text-base"
              >
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>View Vaccine Schedule</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-200 dark:border-slate-800/80 mt-10">
              <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">96.77%</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Model Accuracy</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <div className="text-2xl font-black text-teal-600 dark:text-teal-400">4 Classes</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vision AI Diagnostic</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">Multi-Batch</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Vaccine Tracker</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">10+ Diseases</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Directory & Protocol</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Core Features Navigation Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Comprehensive Poultry Portal</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Everything you need for flock health monitoring, biosecurity, and early disease intervention.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: AI Diagnosis */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Stethoscope className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">3-In-1 Disease Diagnosis</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Upload photos of droppings or birds for computer vision AI prediction, use symptom checklists, or preview video temporal analysis.
            </p>
            <Link to="/diagnosis" className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              <span>Launch Diagnostics</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 2: Vaccine Tracker */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-teal-500/50 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Vaccine Schedule & Tracker</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Track multiple poultry batches (Broilers & Layers), auto-calculate exact calendar due dates, and monitor vaccine completion badges.
            </p>
            <Link to="/vaccines" className="inline-flex items-center space-x-2 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              <span>Track Flock Vaccination</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 3: Disease Directory */}
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300 shadow-sm hover:shadow-md group">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Poultry Disease Directory</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Searchable database of viral, bacterial, and parasitic poultry diseases complete with symptoms, biosecurity, and treatment guidelines.
            </p>
            <Link to="/diseases" className="inline-flex items-center space-x-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline">
              <span>Explore Disease Directory</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* 3. Poultry Maintenance & Management Guide */}
      <section className="py-16 bg-slate-100/70 dark:bg-slate-900/50 border-t border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Best Practices Protocol
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-3">Essential Poultry Maintenance Guide</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Prevent disease outbreaks before they start. Master the 5 fundamental pillars of flock management.
            </p>
          </div>

          {/* Maintenance Pillar Tabs */}
          <div className="flex overflow-x-auto space-x-2 pb-4 mb-8 scrollbar-none justify-start md:justify-center">
            {maintenancePillars.map((pillar) => {
              const Icon = pillar.icon;
              const active = activeTab === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActiveTab(pillar.id)}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-500'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{pillar.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Details Card */}
          {maintenancePillars.map((pillar) => {
            if (pillar.id !== activeTab) return null;
            const Icon = pillar.icon;
            return (
              <div key={pillar.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-md transition-all">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{pillar.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{pillar.shortDesc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pillar.details.map((detail, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      </section>

      {/* 4. Disease Awareness & Early Warning Sign Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Flock Disease Awareness</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Recognize early clinical signs. Compare healthy baseline signals against infection indicators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Healthy Flock Signs */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6 border-b border-emerald-200 dark:border-emerald-800/30 pb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Healthy Flock Signals</h3>
            </div>
            <ul className="space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Active, alert behavior with bright, clear eyes.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Bright red, plump comb and wattles.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Firm brown droppings with distinct white urate caps.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Steady feed and water intake matching age curves.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Smooth, clean, intact feathering.</span>
              </li>
            </ul>
          </div>

          {/* Sick Flock Warning Signs */}
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6 border-b border-red-200 dark:border-red-800/30 pb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Infection Warning Signs</h3>
            </div>
            <ul className="space-y-3.5 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Bloody, watery green, or chalky white vent pasting.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Pale, shriveled, or purple/cyanotic comb and wattles.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Gasping, sneezing, tracheal rales, or nasal discharge.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Twisted neck, circling, or wing/leg paralysis.</span>
              </li>
              <li className="flex items-center space-x-3">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Sharp drop in egg production with wrinkled shells.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 5. Call To Action Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 dark:from-emerald-950/80 dark:via-slate-900 dark:to-teal-950/80 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-xl text-white">
          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Suspect a Disease Outbreak?</h2>
            <p className="text-slate-100 dark:text-slate-300 text-base">
              Upload a photo or select symptoms now to get AI diagnostic confidence scores and veterinary treatment protocols immediately.
            </p>
            <div className="pt-2">
              <Link
                to="/diagnosis"
                className="inline-flex items-center space-x-2 bg-white text-emerald-800 hover:bg-slate-100 font-extrabold text-base px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition-all duration-200"
              >
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <span>Run Instant AI Diagnosis</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
