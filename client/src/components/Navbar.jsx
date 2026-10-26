import React, { useState, useEffect } from 'react';
import { Zap, LayoutDashboard, PlusCircle, Users, Receipt, Calculator, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Bill', icon: PlusCircle },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'history', label: 'Billing History', icon: Receipt },
    { id: 'tariffs', label: 'Tariff Rules & Tests', icon: Calculator },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
          : 'bg-white/60 backdrop-blur-sm border-b border-slate-200/50 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-glow-sm group-hover:scale-105 group-hover:shadow-glow transition-all duration-300">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-cyan-600 transition-colors">
                  Electra<span className="text-cyan-600">Bill</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-100 text-cyan-800 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Smart Electricity Billing</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-cyan-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action / System Status */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SQLite Connected</span>
            </div>

            <button
              onClick={() => setActiveTab('generate')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-glow-sm hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Bill</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto mt-3 pt-2 border-t border-slate-200/60 gap-1 pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-cyan-100 text-cyan-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
