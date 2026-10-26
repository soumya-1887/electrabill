import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CursorGlow from './components/CursorGlow';
import ScrollProgress from './components/ScrollProgress';
import { ToastProvider } from './components/Toast';

import Dashboard from './pages/Dashboard';
import GenerateBill from './pages/GenerateBill';
import Customers from './pages/Customers';
import BillingHistory from './pages/BillingHistory';
import TariffCalculator from './pages/TariffCalculator';
import { Zap, Heart, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <ToastProvider>
      {/* Interactive Cursor Glow Effect */}
      <CursorGlow />

      {/* Top Scroll Progress Effect */}
      <ScrollProgress />

      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white">
        {/* Navigation Bar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          {activeTab === 'dashboard' && (
            <Dashboard setActiveTab={setActiveTab} />
          )}

          {activeTab === 'generate' && (
            <GenerateBill setActiveTab={setActiveTab} />
          )}

          {activeTab === 'customers' && (
            <Customers setActiveTab={setActiveTab} />
          )}

          {activeTab === 'history' && (
            <BillingHistory setActiveTab={setActiveTab} />
          )}

          {activeTab === 'tariffs' && (
            <TariffCalculator setActiveTab={setActiveTab} />
          )}
        </main>

        {/* Footer */}
        <footer className="no-print mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-sm py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-cyan-600 flex items-center justify-center text-white">
                <Zap className="w-3 h-3 fill-white" />
              </div>
              <span className="font-bold text-slate-800">ElectraBill</span>
              <span>— Smart Electricity Billing &amp; Tariff Management System</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SQLite Persistent Storage</span>
              </span>
              <span>•</span>
              <span>Progressive Slab Tariff Standard</span>
            </div>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
