import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { EnterpriseDashboard } from './components/EnterpriseDashboard.jsx';
import { CompanySettings } from './components/CompanySettings.jsx';
import { UploadZone } from './components/UploadZone.jsx';
import { DocumentList } from './components/DocumentList.jsx';
import { DocumentReviewModal } from './components/DocumentReviewModal.jsx';
import { ReuploadModal } from './components/ReuploadModal.jsx';
import { ManualEntryModal } from './components/ManualEntryModal.jsx';
import { ActivityRecordsList } from './components/ActivityRecordsList.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { EmissionFactorDataset } from './components/EmissionFactorDataset.jsx';
import { StatutoryComplianceModal } from './components/StatutoryComplianceModal.jsx';
import {
  checkHealth,
  fetchDocuments,
  fetchActivities,
  reprocessDocumentExtraction,
  getPreviewUrl,
  getCompanyProfile,
  completeCompanyOnboarding,
  setAuthToken,
  getAuthToken,
} from './services/api.js';
import {
  Database,
  RefreshCw,
  Building2,
  ArrowRight,
  Upload,
  AlertTriangle,
  ShieldCheck,
  LayoutDashboard,
  UploadCloud,
  Layers,
  Users,
  Leaf,
  Target,
  FileText,
  Settings,
  Calendar,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Flame,
  Zap,
  Truck,
  Package,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'DATA_UPLOAD' | 'DOCUMENTS' | 'ACTIVITIES' | 'MANUAL_ENTRY' | 'SUPPLIERS' | 'PLANNER' | 'SETTINGS'
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('emission-factor-dataset')) return 'EMISSION_FACTORS';
    }
    return 'LANDING';
  });
  const [healthInfo, setHealthInfo] = useState(null);
  const [company, setCompany] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth modal triggered from landing page or public header
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('REGISTER'); // 'REGISTER' | 'LOGIN'

  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Modals state
  const [reviewDoc, setReviewDoc] = useState(null);
  const [reuploadDoc, setReuploadDoc] = useState(null);
  const [showStatutoryModal, setShowStatutoryModal] = useState(false);

  const refreshHealth = async () => {
    try {
      const data = await checkHealth();
      setHealthInfo(data);
    } catch (err) {
      setHealthInfo({ databaseConnected: false, database: 'disconnected', ocrSpaceConfigured: false });
    }
  };

  const loadProfile = async () => {
    const token = getAuthToken();
    if (!token) {
      setCompany(null);
      setAuthLoading(false);
      return;
    }
    setAuthLoading(true);
    try {
      const res = await getCompanyProfile();
      if (res.success && res.company) {
        setCompany(res.company);
        setCurrentRoute((prev) => (prev === 'LANDING' ? 'WORKSPACE' : prev));
      } else {
        setAuthToken(null);
        setCompany(null);
      }
    } catch (err) {
      setAuthToken(null);
      setCompany(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!company) return;
    setLoadingDocs(true);
    try {
      const res = await fetchDocuments();
      if (res.success) {
        setDocuments(res.documents || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const loadActivities = async () => {
    if (!company) return;
    setLoadingActivities(true);
    try {
      const res = await fetchActivities();
      if (res.success) {
        setActivities(res.activities || []);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    refreshHealth();
    loadProfile();
  }, []);

  useEffect(() => {
    if (company) {
      loadDocuments();
      loadActivities();
    }
  }, [company]);

  // Synchronize route with browser URL history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('emission-factor-dataset')) {
        setCurrentRoute('EMISSION_FACTORS');
      } else if (company) {
        setCurrentRoute('WORKSPACE');
      } else {
        setCurrentRoute('LANDING');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [company]);

  const navigateTo = (route, path = '/') => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', path);
    }
  };

  const handleOpenAuth = (view = 'REGISTER') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const handleAuthenticated = (companyData, token) => {
    setAuthToken(token);
    setCompany(companyData);
    setAuthModalOpen(false);
    setCurrentRoute('WORKSPACE');
    setActiveTab('DASHBOARD');
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCompany(null);
    setDocuments([]);
    setActivities([]);
    setCurrentRoute('LANDING');
    setActiveTab('DASHBOARD');
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleReprocess = async (doc) => {
    try {
      const res = await reprocessDocumentExtraction(doc._id);
      if (res.success) {
        loadDocuments();
      } else {
        alert(res.error || 'Failed to reprocess document');
      }
    } catch (err) {
      alert(`Reprocessing error: ${err.message}`);
    }
  };

  const handleOpenPreview = (doc) => {
    window.open(getPreviewUrl(doc._id), '_blank');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06110d] flex flex-col items-center justify-center text-[#9aada2] space-y-3 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-[#b5f568]" />
        <p className="text-sm font-medium">Initializing Sovereign Carbon Telemetry...</p>
      </div>
    );
  }

  // 1. ROUTE: Verified Emission Factors Dataset
  if (currentRoute === 'EMISSION_FACTORS') {
    return (
      <div className="min-h-screen bg-[#06110d] text-[#d8e6de] flex flex-col font-sans selection:bg-[#b5f568] selection:text-[#102000]">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          healthInfo={healthInfo}
          company={company}
          onLogout={handleLogout}
          onOpenUpload={() => {
            setCurrentRoute('WORKSPACE');
            setActiveTab('DATA_UPLOAD');
          }}
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          onOpenAuth={handleOpenAuth}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmissionFactorDataset
            onBackToWorkspace={() => navigateTo(company ? 'WORKSPACE' : 'LANDING', '/')}
          />
        </main>
        <footer className="border-t border-[#b4ffcd]/10 bg-[#06110d] py-6 text-center text-xs text-[#9aada2] font-mono">
          CarbonIQ Enterprise &bull; Verified National & International Emission Factors Directory &bull; Statutory ESG Accounting
        </footer>

        {authModalOpen && (
          <AuthModal
            initialView={authModalView}
            onAuthenticated={handleAuthenticated}
            onClose={() => setAuthModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // 2. ROUTE: Public Landing Page (when logged out or explicitly navigated to Landing)
  if (currentRoute === 'LANDING' || (!company && currentRoute !== 'EMISSION_FACTORS')) {
    return (
      <div className="min-h-screen bg-[#06110d] text-[#d8e6de] flex flex-col font-sans selection:bg-[#b5f568] selection:text-[#102000]">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          healthInfo={healthInfo}
          company={company}
          onLogout={handleLogout}
          onOpenUpload={() => handleOpenAuth('REGISTER')}
          currentRoute="LANDING"
          onNavigate={navigateTo}
          onOpenAuth={handleOpenAuth}
        />

        <main className="flex-1">
          <LandingPage
            onGetStarted={() => handleOpenAuth('REGISTER')}
            onSignIn={() => handleOpenAuth('LOGIN')}
            onViewFactors={() => navigateTo('EMISSION_FACTORS', '/emission-factor-dataset')}
          />
        </main>

        <footer className="border-t border-[#b4ffcd]/10 bg-[#06110d] py-8 text-center text-xs text-[#9aada2] font-mono">
          CarbonIQ Platform &bull; Corporate Greenhouse Gas Accounting & Statutory ESG Disclosures &bull; Indian SME Edition
        </footer>

        {authModalOpen && (
          <AuthModal
            initialView={authModalView}
            onAuthenticated={handleAuthenticated}
            onClose={() => setAuthModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // 3. ROUTE: Authenticated SME Enterprise Intelligence Workspace (Sidebar + Topbar + Dashboard)
  return (
    <div className="min-h-screen bg-[#06110d] text-[#d8e6de] flex font-sans selection:bg-[#b5f568] selection:text-[#102000] relative overflow-x-hidden">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#06110d] border-r border-[#b4ffcd]/12 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Identity */}
          <div className="p-6 pb-5 border-b border-[#b4ffcd]/10 flex items-center justify-between">
            <div>
              <img
                src="/drkthm-logo.png"
                alt="CarbonIQ"
                className="h-8 w-auto max-w-[170px] object-contain drop-shadow-[0_0_12px_rgba(98,221,158,0.2)]"
              />
              <span className="text-[10px] font-mono text-[#9aada2] tracking-wider uppercase block mt-1 font-semibold">
                SME Carbon Intelligence
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('DASHBOARD');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'DASHBOARD'
                  ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 shadow-[0_0_16px_rgba(181,245,104,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#b5f568]" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('DATA_UPLOAD');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'DATA_UPLOAD'
                  ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 shadow-[0_0_16px_rgba(181,245,104,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-[#62dd9e]" />
              <span>Data Upload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('DOCUMENTS');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'DOCUMENTS' || activeTab === 'ACTIVITIES'
                  ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 shadow-[0_0_16px_rgba(181,245,104,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#38bdf8]" />
              <span>My Records</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SUPPLIERS');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 shadow-[0_0_16px_rgba(181,245,104,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-[#c084fc]" />
              <span>Suppliers</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('PLANNER');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'PLANNER'
                  ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 shadow-[0_0_16px_rgba(181,245,104,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 text-amber-400" />
              <span>Reduction Planner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowStatutoryModal(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:bg-white/[0.04] hover:text-white transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#b5f568]" />
              <span>Reports (BRSR / CBAM)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SETTINGS');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'SETTINGS'
                  ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 shadow-[0_0_16px_rgba(181,245,104,0.2)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-[#9aada2]" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Bottom Sustainability Manifesto */}
          <div className="p-4 m-3 mt-auto rounded-2xl bg-gradient-to-br from-[#0c261a] to-[#040e09] border border-[#62dd9e]/25 relative overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-[#122e1f] border border-[#b5f568]/40 flex items-center justify-center text-[#b5f568] mb-2.5 shadow-[0_0_12px_rgba(181,245,104,0.25)]">
              <Leaf className="w-4 h-4 text-[#b5f568]" />
            </div>
            <div className="text-xs font-mono font-bold text-white leading-tight">
              <div>Measure</div>
              <div>Understand</div>
              <div>Reduce</div>
              <div className="text-[#b5f568]">Grow Sustainably</div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-t border-[#b4ffcd]/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="h-20 border-b border-[#b4ffcd]/12 bg-[#06110d]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Mobile hamburger & Interactive Company Pill (Opens Settings) */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Clickable Company Pill -> Navigates to Settings */}
            <button
              type="button"
              onClick={() => setActiveTab('SETTINGS')}
              className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-[#0b1b14] border border-[#b4ffcd]/18 hover:border-[#b5f568]/60 hover:bg-[#122e1f]/60 shadow-sm transition-all cursor-pointer group"
              title="Click to view & edit company parameters in Settings"
            >
              <Building2 className="w-4 h-4 text-[#62dd9e] group-hover:text-[#b5f568] transition-colors" />
              <span className="font-bold text-white text-xs truncate max-w-[160px] sm:max-w-xs font-mono group-hover:text-[#b5f568] transition-colors">
                {company.companyName}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#121e1a] text-[#b5f568] border border-[#b5f568]/30 font-semibold hidden sm:inline-block">
                {company.businessSize}
              </span>
              <Settings className="w-3.5 h-3.5 text-[#9aada2] group-hover:text-[#b5f568] opacity-60 group-hover:opacity-100 transition-all hidden sm:inline-block" />
            </button>
          </div>

          {/* Right: Primary Action Button */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            {/* Upload Document Primary Button */}
            <button
              type="button"
              onClick={() => setActiveTab('DATA_UPLOAD')}
              className="flex items-center space-x-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-[#b5f568] to-[#9ad84f] text-[#07130f] hover:shadow-[0_0_20px_rgba(181,245,104,0.45)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5 text-[#07130f]" />
              <span>Upload Document</span>
            </button>
          </div>
        </header>

        {/* Database connection alert if offline */}
        {healthInfo && !healthInfo.databaseConnected && (
          <div className="bg-red-950/80 border-b border-red-700/80 text-red-200 text-xs py-2 px-4 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Database Connection Issue:</strong> Carbon inventory services are currently in offline mode.
                </span>
              </div>
              <button
                onClick={refreshHealth}
                className="text-red-300 hover:text-white underline font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div key={activeTab} className="animate-page-switch">
{/* VIEW: Main Enterprise Dashboard */}
          {activeTab === 'DASHBOARD' && (
            <EnterpriseDashboard
              company={company}
              documents={documents}
              activities={activities}
              onOpenUpload={() => setActiveTab('DATA_UPLOAD')}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectDocument={(doc) => setReviewDoc(doc)}
              onOpenStatutoryReports={() => setShowStatutoryModal(true)}
              onLogout={handleLogout}
            />
          )}

          {/* VIEW: Data Upload Zone */}
          {activeTab === 'DATA_UPLOAD' && (
            <div className="space-y-4 animate-page-enter">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white font-mono">Autonomous Ingestion Portal</h2>
                  <p className="text-xs text-[#9aada2] font-mono mt-0.5">
                    Upload electricity bills, generator slips, logistics bilties, or ZIP archives for AI parsing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('DOCUMENTS')}
                  className="text-xs font-mono text-[#b5f568] hover:underline"
                >
                  View Document Registry &rarr;
                </button>
              </div>

              <UploadZone
                onUploadComplete={() => {
                  loadDocuments();
                  loadActivities();
                }}
                onViewDocuments={() => setActiveTab('DOCUMENTS')}
                onViewActivities={() => setActiveTab('ACTIVITIES')}
              />
            </div>
          )}

          {/* VIEW: Documents Registry */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4 animate-page-enter">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white font-mono">Ingested Document Registry</h2>
                  <p className="text-xs text-[#9aada2] font-mono mt-0.5">
                    Continuous OCR pipeline and verifiable source records.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ACTIVITIES')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-[#62dd9e] bg-[#121e1a] border border-[#62dd9e]/30 hover:border-[#b5f568]"
                  >
                    View Verified Ledger
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DATA_UPLOAD')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-[#07130f] bg-[#b5f568]"
                  >
                    + Upload More
                  </button>
                </div>
              </div>

              <DocumentList
                documents={documents}
                loading={loadingDocs}
                onSelectDocument={(doc) => setReviewDoc(doc)}
                onPreviewDocument={handleOpenPreview}
              />
            </div>
          )}

          {/* VIEW: Verified Activity Records Ledger */}
          {activeTab === 'ACTIVITIES' && (
            <div className="space-y-4 animate-page-enter">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white font-mono">Verified Activities Ledger</h2>
                  <p className="text-xs text-[#9aada2] font-mono mt-0.5">
                    Statutory Scope 1, Scope 2, and Scope 3 activity entries.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('MANUAL_ENTRY')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-[#b5f568] bg-[#121e1a] border border-[#b5f568]/40"
                  >
                    + Manual Entry
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DOCUMENTS')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono text-[#62dd9e] bg-[#121e1a] border border-[#62dd9e]/30"
                  >
                    Documents View
                  </button>
                </div>
              </div>

              <ActivityRecordsList
                activities={activities}
                loading={loadingActivities}
                onSelectDocumentById={(id) => {
                  const doc = documents.find((d) => d._id === id);
                  if (doc) setReviewDoc(doc);
                }}
              />
            </div>
          )}

          {/* VIEW: Manual Entry Form */}
          {activeTab === 'MANUAL_ENTRY' && (
            <div className="space-y-4 animate-page-enter">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white font-mono">Manual Statutory Activity Entry</h2>
                  <p className="text-xs text-[#9aada2] font-mono mt-0.5">
                    Direct entry for un-invoiced fuels, freight manifests, and utility meter readings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ACTIVITIES')}
                  className="text-xs font-mono text-[#b5f568] hover:underline"
                >
                  Back to Activity Ledger &rarr;
                </button>
              </div>

              <ManualEntryModal
                onActivityCreated={() => {
                  loadActivities();
                  setActiveTab('ACTIVITIES');
                }}
              />
            </div>
          )}

          {/* VIEW: Scope 3 Supplier Intelligence */}
          {activeTab === 'SUPPLIERS' && (
            <div className="space-y-6 animate-page-enter">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-mono tracking-tight">
                    Scope 3 Supply Chain Intelligence
                  </h2>
                  <p className="text-xs text-[#9aada2] font-mono mt-0.5">
                    Primary vendor emissions data tiering and Environmental Product Declarations (EPD).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatutoryModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 hover:shadow-[0_0_16px_rgba(181,245,104,0.3)] transition"
                >
                  Generate Supplier Disclosure
                </button>
              </div>

              {/* Supplier Tier Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="telemetry-card p-4 rounded-xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90">
                  <span className="text-[10px] font-mono uppercase text-[#9aada2] block">Participating Suppliers</span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">18 Active</span>
                  <span className="text-[10px] text-[#62dd9e] font-mono">68% Response Rate</span>
                </div>
                <div className="telemetry-card p-4 rounded-xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90">
                  <span className="text-[10px] font-mono uppercase text-[#9aada2] block">Primary Data Coverage</span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">62%</span>
                  <span className="text-[10px] text-[#b5f568] font-mono">Activity-based (Tier 1 & 2)</span>
                </div>
                <div className="telemetry-card p-4 rounded-xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90">
                  <span className="text-[10px] font-mono uppercase text-[#9aada2] block">Average Emission Intensity</span>
                  <span className="text-2xl font-black text-white font-mono mt-0.5 block">0.84 kg</span>
                  <span className="text-[10px] text-[#38bdf8] font-mono">CO₂e per ₹ spend</span>
                </div>
              </div>

              {/* Supplier Table */}
              <div className="telemetry-card rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 overflow-hidden">
                <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Engaged Vendor Registry
                  </span>
                  <span className="text-[10px] font-mono text-[#9aada2]">SEBI BRSR Principle 6 Aligned</span>
                </div>
                <div className="divide-y divide-white/[0.06] text-xs font-mono">
                  <div className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div>
                      <div className="text-white font-bold">ABC Flour Mills Ltd.</div>
                      <div className="text-[10px] text-[#9aada2]">Category: Agricultural Raw Materials &bull; GSTIN: 33AAAAA0000A1Z5</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#0f2d1e] text-[#62dd9e] border border-[#62dd9e]/40">
                        EPD Verified (0.8 kg CO₂e/kg)
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div>
                      <div className="text-white font-bold">Green Sugar Industries</div>
                      <div className="text-[10px] text-[#9aada2]">Category: Raw Ingredients &bull; GSTIN: 27BBBBB1111B1Z6</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#18283a] text-[#38bdf8] border border-[#38bdf8]/40">
                        Industry Baseline (1.2 kg CO₂e/kg)
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                    <div>
                      <div className="text-white font-bold">PackPro Sustainable Packaging</div>
                      <div className="text-[10px] text-[#9aada2]">Category: Corrugated Boxes & Paper Packaging</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#291e0a] text-[#facc15] border border-[#facc15]/40">
                        Spend Proxy (0.0005 kg CO₂e/₹)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Reduction Planner */}
          {activeTab === 'PLANNER' && (
            <div className="space-y-6 animate-page-enter">
              <div>
                <h2 className="text-xl font-bold text-white font-mono tracking-tight">
                  Decarbonization Roadmap & Target Modeling
                </h2>
                <p className="text-xs text-[#9aada2] font-mono mt-0.5">
                  Plan reduction initiatives aligned with India's 2030 NDC targets and corporate net-zero milestones.
                </p>
              </div>

              {/* Target Banner */}
              <div className="telemetry-card p-6 rounded-2xl border border-[#b5f568]/30 bg-gradient-to-br from-[#0c261a] to-[#040e09] relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#b5f568] block">
                      Corporate 2030 Trajectory
                    </span>
                    <h3 className="text-2xl font-black text-white font-mono mt-1">35% Carbon Reduction Target</h3>
                    <p className="text-xs text-[#9aada2] font-mono mt-1">
                      Projected reduction: <span className="text-[#b5f568] font-bold">4.4 t CO₂e annually</span> by implementing on-site solar & route optimization.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#122e1f] border border-[#b5f568]/40 text-[#b5f568] font-mono font-bold text-lg text-center shrink-0">
                    <div>-4.4 t</div>
                    <div className="text-[9px] text-[#9aada2] uppercase">Target Savings</div>
                  </div>
                </div>
              </div>

              {/* Scenario Modeling Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="telemetry-card p-5 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#b5f568]">
                    <Zap className="w-4 h-4 text-[#b5f568]" />
                    <span>Solar Rooftop PPA (Scope 2 Zero Baseline)</span>
                  </div>
                  <p className="text-xs text-[#9aada2] font-mono">
                    Replaces grid electricity (CEA v20.0 0.727 kg CO₂/kWh) with zero-emission onsite solar.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-[#62dd9e]">
                    Expected Abatement: <strong>2.1 t CO₂e / year</strong> (17% reduction)
                  </div>
                </div>

                <div className="telemetry-card p-5 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#38bdf8]">
                    <Truck className="w-4 h-4 text-[#38bdf8]" />
                    <span>Electric Logistics Delivery Fleet Conversion</span>
                  </div>
                  <p className="text-xs text-[#9aada2] font-mono">
                    Electrifies last-mile distribution vans to replace diesel combustion slips.
                  </p>
                  <div className="pt-2 text-[11px] font-mono text-[#38bdf8]">
                    Expected Abatement: <strong>1.8 t CO₂e / year</strong> (14% reduction)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Settings View */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 animate-page-enter">
              <div>
                <h2 className="text-xl font-bold text-white font-mono tracking-tight">
                  Company Profile & Accounting Boundaries
                </h2>
                <p className="text-xs text-[#9aada2] font-mono mt-0.5">
                  Verified statutory parameters for statutory GHG Protocol and CEA accounting.
                </p>
              </div>

              <div className="telemetry-card p-6 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-[#9aada2] text-[10px] uppercase block mb-1">Company Legal Name</label>
                    <input
                      type="text"
                      readOnly
                      value={company.companyName}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#040a08] border border-white/[0.08] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[#9aada2] text-[10px] uppercase block mb-1">Business Scale</label>
                    <input
                      type="text"
                      readOnly
                      value={company.businessSize}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#040a08] border border-white/[0.08] text-[#b5f568] font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[#9aada2] text-[10px] uppercase block mb-1">Primary Industry Sector</label>
                    <input
                      type="text"
                      readOnly
                      value={company.industryType}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#040a08] border border-white/[0.08] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[#9aada2] text-[10px] uppercase block mb-1">GSTIN Identifier</label>
                    <input
                      type="text"
                      readOnly
                      value={company.gstin || 'Not Provided'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#040a08] border border-white/[0.08] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[#9aada2] text-[10px] uppercase block mb-1">Reporting Currency</label>
                    <input
                      type="text"
                      readOnly
                      value="Indian Rupee (₹ INR)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#040a08] border border-white/[0.08] text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[#9aada2] text-[10px] uppercase block mb-1">Factor Database Baseline</label>
                    <input
                      type="text"
                      readOnly
                      value="CEA v20.0 & MoEFCC Aligned"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#040a08] border border-white/[0.08] text-[#62dd9e]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>

        {/* Global Workspace Footer */}
        <footer className="border-t border-[#b4ffcd]/10 bg-[#06110d] py-6 text-center text-xs text-[#9aada2] font-mono mt-auto">
          CarbonIQ Enterprise &bull; Corporate Greenhouse Gas Accounting & Statutory ESG Disclosures &bull; Indian SME Edition (₹ INR)
        </footer>
      </div>

      {/* Review & Field Verification Modal */}
      <DocumentReviewModal
        document={reviewDoc}
        isOpen={Boolean(reviewDoc)}
        onClose={() => setReviewDoc(null)}
        onSaved={() => {
          loadDocuments();
          loadActivities();
        }}
        onTriggerReupload={(doc) => {
          setReviewDoc(null);
          setReuploadDoc(doc);
        }}
        onTriggerReprocess={(doc) => {
          handleReprocess(doc);
        }}
      />

      {/* Re-upload Modal for ambiguous / low-confidence documents */}
      <ReuploadModal
        document={reuploadDoc}
        isOpen={Boolean(reuploadDoc)}
        onClose={() => setReuploadDoc(null)}
        onReuploaded={() => {
          loadDocuments();
          loadActivities();
        }}
      />

      {/* Statutory Compliance Export Modal (SEBI BRSR Core & EU CBAM) */}
      <StatutoryComplianceModal
        isOpen={showStatutoryModal}
        onClose={() => setShowStatutoryModal(false)}
        company={company}
      />
    </div>
  );
}

export default App;
