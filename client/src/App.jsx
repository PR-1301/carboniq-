import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { UploadZone } from './components/UploadZone.jsx';
import { DocumentList } from './components/DocumentList.jsx';
import { DocumentReviewModal } from './components/DocumentReviewModal.jsx';
import { ReuploadModal } from './components/ReuploadModal.jsx';
import { ManualEntryModal } from './components/ManualEntryModal.jsx';
import { ActivityRecordsList } from './components/ActivityRecordsList.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { EmissionFactorDataset } from './components/EmissionFactorDataset.jsx';
import {
  checkHealth,
  fetchDocuments,
  fetchActivities,
  reprocessDocumentExtraction,
  getPreviewUrl,
  getCompanyProfile,
  completeCompanyOnboarding,
  setAuthToken,
} from './services/api.js';
import {
  Database,
  RefreshCw,
  Building2,
  ArrowRight,
  Upload,
  AlertTriangle,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('DOCUMENTS'); // 'DOCUMENTS' | 'MANUAL_ENTRY' | 'ACTIVITIES'
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
  const [showWorkspaceUpload, setShowWorkspaceUpload] = useState(false);

  const refreshHealth = async () => {
    try {
      const data = await checkHealth();
      setHealthInfo(data);
    } catch (err) {
      setHealthInfo({ databaseConnected: false, database: 'disconnected', ocrSpaceConfigured: false });
    }
  };

  const loadProfile = async () => {
    setAuthLoading(true);
    try {
      const res = await getCompanyProfile();
      if (res.success && res.company) {
        setCompany(res.company);
        // If user already authenticated and on root path, go to workspace
        setCurrentRoute((prev) => (prev === 'LANDING' ? 'WORKSPACE' : prev));
      } else {
        setCompany(null);
      }
    } catch (err) {
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

  const navigateTo = (route, path) => {
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
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      const res = await completeCompanyOnboarding();
      if (res.success) {
        setCompany(res.company);
        setActiveTab('DOCUMENTS');
      }
    } catch (err) {
      alert(`Onboarding error: ${err.message}`);
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-medium">Initializing CarbonIQ Platform...</p>
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
          onOpenUpload={() => setShowWorkspaceUpload(true)}
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
          currentRoute="LANDING"
          onNavigate={navigateTo}
          onOpenAuth={handleOpenAuth}
        />
        <main className="flex-1">
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onNavigateToDataset={() => navigateTo('EMISSION_FACTORS', '/emission-factor-dataset')}
            company={company}
            onEnterWorkspace={() => navigateTo('WORKSPACE', '/')}
          />
        </main>

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

  // 3. ROUTE: Authenticated SME Workspace
  return (
    <div className="min-h-screen bg-[#06110d] text-[#d8e6de] flex flex-col font-sans selection:bg-[#b5f568] selection:text-[#102000]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthInfo={healthInfo}
        company={company}
        onLogout={handleLogout}
        onOpenUpload={() => setShowWorkspaceUpload(true)}
        currentRoute="WORKSPACE"
        onNavigate={navigateTo}
      />

      {/* Database warning banner if disconnected */}
      {healthInfo && !healthInfo.databaseConnected && (
        <div className="bg-red-950/80 border-b border-red-700/80 text-red-200 text-xs py-2.5 px-4 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>Database Connection Issue:</strong> Carbon inventory services are currently in offline mode. Please verify database availability.
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

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-page-enter">
        {/* Stagger 1: Enterprise SME Telemetry Header Bar */}
        <div className="telemetry-card p-5 sm:p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-[#b4ffcd]/18 bg-[#0b1b14]/90 backdrop-blur-2xl shadow-xl relative overflow-hidden animate-stagger-1">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b5f568]/40 to-transparent" />
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-[#16a36a]/20 border border-[#62dd9e]/40 flex items-center justify-center text-[#62dd9e] font-black text-xl shadow-[0_0_20px_rgba(98,221,158,0.25)]">
              <Building2 className="w-6 h-6 text-[#b5f568]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="font-extrabold text-white text-lg sm:text-xl tracking-tight">
                  {company.companyName}
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#121e1a] text-[#b5f568] border border-[#b5f568]/30 font-semibold">
                  {company.businessSize}
                </span>
              </div>
              <div className="text-[#9aada2] flex flex-wrap items-center gap-2 font-mono text-xs mt-1">
                <span className="text-[#62dd9e] font-semibold">{company.industryType}</span>
                <span>&bull;</span>
                <span className="text-white font-medium">Accounting: ₹ INR</span>
                {company.gstin && (
                  <>
                    <span>&bull;</span>
                    <span className="text-[#7dd9a3]">GSTIN: {company.gstin}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowWorkspaceUpload(!showWorkspaceUpload)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-mono font-semibold bg-gradient-to-r from-[#b5f568] to-[#9ad84f] text-[#07130f] hover:shadow-[0_0_20px_rgba(181,245,104,0.4)] transition-all active:scale-95 shadow-md cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{showWorkspaceUpload ? 'Hide Ingestion Zone' : 'Ingest Documents'}</span>
            </button>
          </div>
        </div>

        {/* Stagger 2: Telemetry Metrics Summary KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-stagger-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('DOCUMENTS');
              setTimeout(() => {
                const elem = document.getElementById('workspace-tabs-content');
                if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
            className={`telemetry-card p-5 sm:p-6 rounded-2xl border bg-[#0b1b14]/85 backdrop-blur-xl flex items-center justify-between text-left group transition-all duration-300 cursor-pointer ${
              activeTab === 'DOCUMENTS'
                ? 'border-[#b5f568]/50 shadow-[0_0_24px_rgba(181,245,104,0.18)] ring-1 ring-[#b5f568]/30'
                : 'border-[#b4ffcd]/15 hover:border-[#b5f568]/40'
            }`}
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aada2] block">
                Ingested Documents
              </span>
              <span className="text-3xl font-black text-white font-mono mt-1 block group-hover:text-[#b5f568] transition-colors">
                {documents.length}
              </span>
              <span className="text-[11px] text-[#62dd9e] font-mono flex items-center gap-1.5 mt-1">
                <span>Continuous OCR Pipeline</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-[#b5f568] group-hover:underline">View Registry &darr;</span>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#121e1a] border border-[#62dd9e]/30 text-[#62dd9e] group-hover:bg-[#b5f568]/15 group-hover:border-[#b5f568]/60 transition-all duration-300 group-hover:scale-105">
              <Upload className="w-5 h-5 text-[#b5f568]" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ACTIVITIES');
              setTimeout(() => {
                const elem = document.getElementById('workspace-tabs-content');
                if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
            className={`telemetry-card p-5 sm:p-6 rounded-2xl border bg-[#0b1b14]/85 backdrop-blur-xl flex items-center justify-between text-left group transition-all duration-300 cursor-pointer ${
              activeTab === 'ACTIVITIES'
                ? 'border-[#b5f568]/50 shadow-[0_0_24px_rgba(181,245,104,0.18)] ring-1 ring-[#b5f568]/30'
                : 'border-[#b4ffcd]/15 hover:border-[#b5f568]/40'
            }`}
          >
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aada2] block">
                Verified Activities
              </span>
              <span className="text-3xl font-black text-white font-mono mt-1 block group-hover:text-[#b5f568] transition-colors">
                {activities.length}
              </span>
              <span className="text-[11px] text-[#b5f568] font-mono flex items-center gap-1.5 mt-1">
                <span>Scope 1, 2 & 3 Ledger</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-[#b5f568] group-hover:underline">View Ledger &darr;</span>
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#121e1a] border border-[#b5f568]/30 text-[#b5f568] group-hover:bg-[#b5f568]/15 group-hover:border-[#b5f568]/60 transition-all duration-300 group-hover:scale-105">
              <Database className="w-5 h-5 text-[#62dd9e]" />
            </div>
          </button>
        </div>

        {/* Stagger 3: Ingestion Zone Toggle */}
        {(showWorkspaceUpload || documents.length === 0) && (
          <div className="animate-stagger-3">
            <UploadZone
              onUploadComplete={() => {
                loadDocuments();
                loadActivities();
              }}
              onViewDocuments={() => {
                setActiveTab('DOCUMENTS');
                setTimeout(() => {
                  const elem = document.getElementById('workspace-tabs-content');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              onViewActivities={() => {
                setActiveTab('ACTIVITIES');
                setTimeout(() => {
                  const elem = document.getElementById('workspace-tabs-content');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
            />
          </div>
        )}

        {/* Stagger 4: Active Tab Views */}
        <div
          id="workspace-tabs-content"
          key={activeTab}
          className="animate-tab-change animate-stagger-3 scroll-mt-24"
        >
          {/* Tab: Documents Registry */}
          {activeTab === 'DOCUMENTS' && (
            <DocumentList
              documents={documents}
              loading={loadingDocs}
              onSelectDocument={(doc) => setReviewDoc(doc)}
              onPreviewDocument={handleOpenPreview}
            />
          )}

          {/* Tab: Direct Manual Carbon Entry */}
          {activeTab === 'MANUAL_ENTRY' && (
            <ManualEntryModal
              onActivityCreated={() => {
                loadActivities();
                setActiveTab('ACTIVITIES');
              }}
            />
          )}

          {/* Tab: Verified Activity Records */}
          {activeTab === 'ACTIVITIES' && (
            <ActivityRecordsList
              activities={activities}
              loading={loadingActivities}
              onSelectDocumentById={(id) => {
                const doc = documents.find((d) => d._id === id);
                if (doc) setReviewDoc(doc);
              }}
            />
          )}
        </div>
      </main>

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

      {/* Workspace Footer */}
      <footer className="border-t border-[#b4ffcd]/10 bg-[#06110d] py-6 text-center text-xs text-[#9aada2] font-mono">
        CarbonIQ Enterprise &bull; Corporate Greenhouse Gas Accounting & Statutory ESG Disclosures &bull; Indian SME Medium (₹ INR)
      </footer>
    </div>
  );
}

export default App;
