import React from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  PlusCircle,
  Layers,
  LogOut,
  Building,
  Upload,
  Sparkles,
} from 'lucide-react';

export function Navbar({
  activeTab,
  setActiveTab,
  healthInfo,
  company,
  onLogout,
  onOpenUpload,
  currentRoute = 'MAIN',
  onNavigate,
}) {
  const isDbConnected = healthInfo?.databaseConnected;
  const isOcrConfigured = healthInfo?.ocrSpaceConfigured;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & SME Title */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xl">
              C
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">CarbonIQ</span>
                <span className="text-xs bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
                  India SME (₹)
                </span>
              </div>
              {company ? (
                <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                  <span className="font-medium text-emerald-300 truncate max-w-[180px] sm:max-w-xs">
                    {company.companyName}
                  </span>
                  {company.gstin && (
                    <span className="hidden sm:inline-block px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono rounded">
                      GSTIN: {company.gstin}
                    </span>
                  )}
                  <span className="text-slate-500">•</span>
                  <span className="text-[11px] text-slate-400">{company.industryType}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Indian SME Carbon Footprint Portal</p>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Only when authenticated) */}
          {company && (
            <nav className="hidden md:flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('DOCUMENTS')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'DOCUMENTS'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Documents</span>
              </button>

              <button
                onClick={() => setActiveTab('MANUAL_ENTRY')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'MANUAL_ENTRY'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Manual Entry (₹)</span>
              </button>

              <button
                onClick={() => setActiveTab('ACTIVITIES')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ACTIVITIES'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Verified Activities</span>
              </button>
            </nav>
          )}

          {/* Right Action: Status & Logout */}
          <div className="flex items-center space-x-3 text-xs">
            <div
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
                isDbConnected
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                  : 'bg-red-950/40 border-red-700/50 text-red-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>MongoDB: {isDbConnected ? 'Connected' : 'Offline'}</span>
            </div>

            {onNavigate && (
              <button
                type="button"
                onClick={() =>
                  currentRoute === 'EMISSION_FACTORS'
                    ? onNavigate('MAIN', '/')
                    : onNavigate('EMISSION_FACTORS', '/emission-factor-dataset')
                }
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  currentRoute === 'EMISSION_FACTORS'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="View Verified Emission Factors Dataset"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentRoute === 'EMISSION_FACTORS' ? 'Back to App' : 'Emission Factors'}</span>
              </button>
            )}

            {company ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 transition"
                  title="Logout Company"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
