import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { UploadZone } from './components/UploadZone.jsx';
import { DocumentList } from './components/DocumentList.jsx';
import { DocumentReviewModal } from './components/DocumentReviewModal.jsx';
import { ReuploadModal } from './components/ReuploadModal.jsx';
import { ManualEntryModal } from './components/ManualEntryModal.jsx';
import { ActivityRecordsList } from './components/ActivityRecordsList.jsx';
import { AuthModal } from './components/AuthModal.jsx';
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
  KeyRound,
  RefreshCw,
  Building2,
  CheckCircle,
  ArrowRight,
  Upload,
  PlusCircle,
  FileText,
  Layers,
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('DOCUMENTS'); // 'DOCUMENTS' | 'MANUAL_ENTRY' | 'ACTIVITIES'
  const [healthInfo, setHealthInfo] = useState(null);
  const [company, setCompany] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  const handleAuthenticated = (companyData, token) => {
    setAuthToken(token);
    setCompany(companyData);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCompany(null);
    setDocuments([]);
    setActivities([]);
  };

  const handleCompleteOnboarding = async () => {
    try {
      const res = await completeCompanyOnboarding();
      if (res.success) {
        setCompany(res.company);
        setActiveTab('DOCUMENTS');
      }
    } catch (err) {
      alert(`Onboarding completion error: ${err.message}`);
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
        <p className="text-sm font-medium">Loading CarbonIQ Indian SME Portal...</p>
      </div>
    );
  }

  // If not logged in, show Indian SME Auth Modal (Registration & Login)
  if (!company) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar healthInfo={healthInfo} onRefresh={refreshHealth} />
        <AuthModal onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthInfo={healthInfo}
        company={company}
        onLogout={handleLogout}
        onOpenUpload={() => setShowWorkspaceUpload(true)}
      />

      {/* Database warning banner */}
      {healthInfo && !healthInfo.databaseConnected && (
        <div className="bg-red-950/80 border-b border-red-700/80 text-red-200 text-xs py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>MongoDB is Offline:</strong> Please verify local MongoDB is running on port 27017 (URI: mongodb://127.0.0.1:27017/carboniq).
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

      {/* OCR Space API Key banner */}
      {healthInfo && !healthInfo.ocrSpaceConfigured && (
        <div className="bg-amber-950/40 border-b border-amber-800/40 text-amber-200 text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center space-x-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>OCR.space Key:</strong> Configure <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">OCR_SPACE_API_KEY</code> in <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">server/.env</code> for scanned image OCR.
            </span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* OPTION B WORKFLOW: NEW COMPANY REGISTRATION ONBOARDING */}
        {!company.hasCompletedOnboarding ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-600/40 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-600/50">
                      Step 2: SME Document Ingestion
                    </span>
                    <span className="text-xs text-slate-400">Indian Rupee Medium (₹)</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mt-1.5">
                    Welcome, {company.companyName}!
                  </h1>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    As part of your new company registration, upload your baseline operational documents (electricity bills, fuel receipts, logistics manifests, waste logs, or audit spreadsheets) to bootstrap your carbon accounting.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition shrink-0"
                >
                  <span>Complete Onboarding & Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* The Upload UI shown specifically for registering SME */}
            <UploadZone
              onUploadComplete={() => {
                loadDocuments();
                loadActivities();
              }}
            />

            {/* Preview of Ingested Documents in Onboarding */}
            {documents.length > 0 && (
              <DocumentList
                documents={documents}
                loading={loadingDocs}
                onSelectDocument={(doc) => setReviewDoc(doc)}
                onPreviewDocument={handleOpenPreview}
                onReuploadDocument={(doc) => setReuploadDoc(doc)}
                onReprocessDocument={handleReprocess}
              />
            )}
          </div>
        ) : (
          /* OPTION B: RETURNING LOGGED-IN SME MAIN WORKSPACE */
          <div className="space-y-6">
            {/* SME Summary Bar */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{company.companyName}</div>
                  <div className="text-slate-400 flex items-center space-x-2 font-mono text-[11px] mt-0.5">
                    <span>{company.businessSize} SME</span>
                    <span>•</span>
                    <span>{company.industryType}</span>
                    <span>•</span>
                    <span className="text-emerald-400">Currency: ₹ INR</span>
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
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{showWorkspaceUpload ? 'Hide Upload Zone' : 'Upload Additional Documents'}</span>
                </button>
              </div>
            </div>

            {/* Optional Upload Zone in Workspace */}
            {showWorkspaceUpload && (
              <UploadZone
                onUploadComplete={() => {
                  loadDocuments();
                  loadActivities();
                }}
              />
            )}

            {/* Tab: Documents Registry */}
            {activeTab === 'DOCUMENTS' && (
              <DocumentList
                documents={documents}
                loading={loadingDocs}
                onSelectDocument={(doc) => setReviewDoc(doc)}
                onPreviewDocument={handleOpenPreview}
                onReuploadDocument={(doc) => setReuploadDoc(doc)}
                onReprocessDocument={handleReprocess}
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

      {/* Re-upload Clearer Replacement Modal */}
      <ReuploadModal
        document={reuploadDoc}
        isOpen={Boolean(reuploadDoc)}
        onClose={() => setReuploadDoc(null)}
        onReuploaded={() => {
          loadDocuments();
          loadActivities();
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        CarbonIQ &bull; Indian SME Carbon Footprint Portal (₹ INR) &bull; JWT Secured &bull; Local MongoDB
      </footer>
    </div>
  );
}

export default App;
