import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, ShieldCheck, BookOpen, Home, Menu, X, Activity, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'AI Diagnosis', path: '/diagnosis', icon: Stethoscope, badge: 'ML Model' },
    { name: 'Vaccine Schedule', path: '/vaccines', icon: ShieldCheck },
    { name: 'Disease Directory', path: '/diseases', icon: BookOpen }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform duration-200">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-white dark:to-emerald-400 bg-clip-text text-transparent">
                PoulCare<span className="text-emerald-500">AI</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 -mt-1">
                Poultry Health Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Theme Toggle Button (Light ☀️ / Dark 🌙) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer ml-2"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </button>

            {/* Quick AI Diagnosis Action Button */}
            <Link
              to="/diagnosis"
              className="ml-3 flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Sparkles className="h-4 w-4" />
              <span>Diagnose Flock</span>
            </Link>
          </div>

          {/* Mobile Menu & Theme Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-emerald-500" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          
          <div className="pt-2">
            <Link
              to="/diagnosis"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold py-3 rounded-xl shadow-md"
            >
              <Sparkles className="h-5 w-5" />
              <span>Diagnose Flock Now</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
