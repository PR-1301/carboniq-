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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Onboarding View for Newly Registered Company */}
        {!company.hasCompletedOnboarding ? (
          <div className="space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      Step 2: Operational Data Ingestion
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Currency: ₹ INR</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 tracking-tight">
                    Welcome, {company.companyName}
                  </h1>
                  <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                    Upload your baseline operational records—electricity bills, generator fuel slips, logistics manifests, and audit spreadsheets—to initiate automated activity parsing and statutory emissions accounting.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition shrink-0"
                >
                  <span>Complete Onboarding & Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ingestion Upload Zone */}
            <UploadZone
              onUploadComplete={() => {
                loadDocuments();
                loadActivities();
              }}
            />

            {/* Ingested Documents Preview */}
            {documents.length > 0 && (
              <DocumentList
                documents={documents}
                loading={loadingDocs}
                onSelectDocument={(doc) => setReviewDoc(doc)}
                onPreviewDocument={handleOpenPreview}
              />
            )}
          </div>
        ) : (
          /* Main Workspace for Registered Company */
          <div className="space-y-6">
            {/* Enterprise SME Header Bar */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white text-base tracking-tight">{company.companyName}</div>
                  <div className="text-slate-400 flex flex-wrap items-center gap-2 font-mono text-xs mt-0.5">
                    <span className="text-emerald-300 font-semibold">{company.businessSize} Enterprise</span>
                    <span>•</span>
                    <span>{company.industryType}</span>
                    <span>•</span>
                    <span className="text-emerald-400">Accounting: ₹ INR</span>
                    {company.gstin && (
                      <>
                        <span>•</span>
                        <span>GSTIN: {company.gstin}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceUpload(!showWorkspaceUpload)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/50 transition shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{showWorkspaceUpload ? 'Hide Ingestion Zone' : 'Upload Documents'}</span>
                </button>
              </div>
            </div>

            {/* Ingestion Zone Toggle */}
            {showWorkspaceUpload && (
              <div className="glass-card p-4 rounded-2xl border border-emerald-500/20">
                <UploadZone
                  onUploadComplete={() => {
                    loadDocuments();
                    loadActivities();
                  }}
                />
              </div>
            )}

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
        )}
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
