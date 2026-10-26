import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, gradient, accentColor = 'cyan' }) {
  return (
    <div className="relative group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-glow-sm hover:border-cyan-300 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 pt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            gradient || 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-sm'
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent group-hover:via-cyan-500 transition-all duration-300"></div>
    </div>
  );
}
