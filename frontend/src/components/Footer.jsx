import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, PhoneCall, HeartHandshake } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-12 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">PoulCare<span className="text-emerald-500">AI</span></span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Empowering poultry farmers with computer-vision AI disease diagnosis, symptom intelligence, and multi-batch vaccination tracking.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-lg w-fit">
              <ShieldAlert className="h-4 w-4" />
              <span>Biosecurity Grade AI Portal</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Portal Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home & Maintenance Guide</Link>
              </li>
              <li>
                <Link to="/diagnosis" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">AI Image & Symptom Diagnosis</Link>
              </li>
              <li>
                <Link to="/vaccines" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Vaccination Schedule & Batch Tracker</Link>
              </li>
              <li>
                <Link to="/diseases" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Poultry Disease Directory</Link>
              </li>
            </ul>
          </div>

          {/* Disease Highlights */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-4">Core Diseases Detected</h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span>Coccidiosis (Eimeria infection)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                <span>Newcastle Disease (NCD Virulent)</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                <span>Salmonellosis & Pullorum</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span>Infectious Bronchitis & Coryza</span>
              </li>
            </ul>
          </div>

          {/* Emergency & Advisory */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-4">Veterinary Advisory</h3>
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-4 rounded-xl space-y-3 shadow-sm">
              <div className="flex items-start space-x-3 text-xs text-slate-700 dark:text-slate-300">
                <PhoneCall className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Emergency Outbreak Support</span>
                  <p className="text-slate-500 dark:text-slate-400">Consult certified avian veterinarians immediately upon high mortality.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                <HeartHandshake className="h-3.5 w-3.5 text-teal-500" />
                <span>AI models assist early detection, not a substitute for clinical autopsy.</span>
              </div>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} PoulCare AI. Smart Poultry Management & Disease Awareness.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="hover:text-slate-700 dark:hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-400 cursor-pointer">Biosecurity Terms</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-400 cursor-pointer">Veterinary Disclaimer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
