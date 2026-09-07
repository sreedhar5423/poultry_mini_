import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Diagnosis from './pages/Diagnosis';
import Vaccines from './pages/Vaccines';
import Diseases from './pages/Diseases';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-300">
          {/* Navigation Header */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/diagnosis" element={<Diagnosis />} />
              <Route path="/vaccines" element={<Vaccines />} />
              <Route path="/diseases" element={<Diseases />} />
            </Routes>
          </main>

          {/* Footer Information */}
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
