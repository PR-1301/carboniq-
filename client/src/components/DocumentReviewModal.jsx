import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  FileText,
  Eye,
  Info,
  Calendar,
  Layers,
  Lock,
  Zap,
  Flame,
  Truck,
  Recycle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  ShieldCheck,
  TrendingDown,
  ExternalLink,
  Download,
} from 'lucide-react';
import { getPreviewUrl, submitDocumentReview, downloadDocumentReportPDF } from '../services/api.js';
import { ProcessingStatusBadge, ReviewStatusBadge, RelevanceBadge, ScopeBadge } from './StatusBadge.jsx';
import { calculateLocalEmissions } from '../utils/carbonEmissionCalculator.js';

export function DocumentReviewModal({
  document,
  isOpen,
  onClose,
  onSaved,
  onTriggerReupload,
  onTriggerReprocess,
}) {
  if (!isOpen || !document) return null;

  const isPermanentlyReviewed = document.reviewStatus === 'APPROVED' || document.reviewStatus === 'REJECTED';

  // The document data is unclear / not discoverable if:
  const isDataUnclearOrUndiscoverable =
    !isPermanentlyReviewed && (
      document.processingStatus === 'NEEDS_REVIEW' ||
      document.processingStatus === 'FAILED' ||
      document.reviewStatus === 'REQUIRED' ||
      document.carbonRelevance === 'UNCERTAIN' ||
      !document.extractedFields?.quantity ||
      !document.extractedFields?.unit ||
      Boolean(document.validationErrors && document.validationErrors.length > 0) ||
      !document.extractedText ||
      document.extractedText.trim().length === 0
    );

  const [category, setCategory] = useState('ELECTRICITY');
  const [scope, setScope] = useState('SCOPE_2');
  const [activityDate, setActivityDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');

  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('FIELDS'); // 'FIELDS' | 'TEXT'
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [suggestedEmissions, setSuggestedEmissions] = useState(null);

  const handleDownloadPdf = async () => {
    if (!document?._id) return;
    try {
      setDownloadingPdf(true);
      await downloadDocumentReportPDF(document._id, document.originalFileName);
    } catch (err) {
      console.error('Failed to download document PDF certificate:', err);
      alert(err.message || 'Failed to download certificate');
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (document) {
      const f = document.extractedFields || {};
      const cat = f.category || (document.documentType === 'FUEL_RECEIPT' ? 'FUEL' : 'ELECTRICITY');
      setCategory(cat);
      setScope(f.scope || (document.scope && document.scope.startsWith('SCOPE_') ? document.scope : defaultScopeForCategory(cat)));
      setQuantity(f.quantity != null ? String(f.quantity) : '');
      setUnit(f.unit || defaultUnitForCategory(cat));
      setSupplierName(f.supplierName || '');
      setDescription(f.description || '');

      if (f.activityDate) {
        const d = new Date(f.activityDate);
        if (!isNaN(d.getTime())) {
          setActivityDate(d.toISOString().split('T')[0]);
        }
      } else {
        setActivityDate(new Date().toISOString().split('T')[0]);
      }

      const cd = f.categoryData || {};
      setFuelType(cd.fuelType || '');
      setTransportMode(cd.transportMode || '');
      setWasteType(cd.wasteType || '');
      setDisposalMethod(cd.disposalMethod || '');

      setValidationErrors(document.validationErrors || []);
      setErrorMessage(null);
    }
  }, [document]);

  // Dynamically recalculate suggested carbon emissions according to verified emission factor models
  useEffect(() => {
    const calc = calculateLocalEmissions({
      category,
      scope,
      quantity,
      unit,
      fuelType,
      transportMode,
      wasteType,
      disposalMethod,
      supplierName,
      description,
    });
    setSuggestedEmissions(calc);
  }, [category, scope, quantity, unit, fuelType, transportMode, wasteType, disposalMethod, supplierName, description]);


  const getCategoryIcon = () => {
    if (category === 'WASTE') {
      return disposalMethod === 'Recycled' ? (
        <Recycle className="w-4 h-4 text-[#62dd9e]" />
      ) : (
        <Recycle className="w-4 h-4 text-purple-400" />
      );
    }
    if (category === 'FUEL') return <Flame className="w-4 h-4 text-amber-400" />;
    if (category === 'TRANSPORTATION') return <Truck className="w-4 h-4 text-sky-400" />;
    if (category === 'ELECTRICITY') return <Zap className="w-4 h-4 text-[#b5f568]" />;
    return <Calculator className="w-4 h-4 text-[#62dd9e]" />;
  };

  const defaultScopeForCategory = (cat) => {
    switch (cat) {
      case 'ELECTRICITY': return 'SCOPE_2';
      case 'FUEL': return 'SCOPE_1';
      case 'TRANSPORTATION': return 'SCOPE_3';
      case 'WASTE': return 'SCOPE_3';
      default: return 'SCOPE_3';
    }
  };

  const defaultUnitForCategory = (cat) => {
    switch (cat) {
      case 'ELECTRICITY': return 'kWh';
      case 'FUEL': return 'Liters';
      case 'TRANSPORTATION': return 'km';
      case 'WASTE': return 'kg';
      default: return 'units';
    }
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setUnit(defaultUnitForCategory(newCat));
    setScope(defaultScopeForCategory(newCat));
  };

  const handleApprove = async () => {
    if (isPermanentlyReviewed) return;
    setSaving(true);
    setErrorMessage(null);

    const correctedFields = {
      category,
      scope,
      activityDate: activityDate ? new Date(activityDate) : null,
      quantity: parseFloat(quantity),
      unit: unit.trim(),
      supplierName: supplierName.trim(),
      description: description.trim(),
      categoryData: {
        fuelType,
        transportMode,
        wasteType,
        disposalMethod,
      },
    };

    try {
      const res = await submitDocumentReview(document._id, {
        action: 'APPROVED',
        correctedFields,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to verify and record activity');
        if (res.validationErrors) {
          setValidationErrors(res.validationErrors);
        }
        return;
      }

      if (onSaved) onSaved(res.document);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error recording activity to ledger');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this document from carbon accounting?')) {
      return;
    }

    setSaving(true);
    try {
      const res = await submitDocumentReview(document._id, {
        action: 'REJECTED',
      });
      if (onSaved) onSaved(res.document);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error rejecting document');
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = getPreviewUrl(document._id);
  const isImage = document.mimeType?.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#030906]/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#071610] border-2 border-[#62dd9e]/40 rounded-2xl w-full max-w-6xl shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_48px_rgba(98,221,158,0.2)] flex flex-col max-h-[92vh] overflow-hidden relative animate-modal-enter">
        {/* Top Specular Rim */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b5f568] to-transparent z-20 pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-[#62dd9e]/20 bg-[#091f16] backdrop-blur-xl">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#0e2a1e] border border-[#b5f568]/50 text-[#b5f568] shadow-[0_0_16px_rgba(181,245,104,0.3)] shrink-0">
              <FileText className="w-5 h-5 text-[#b5f568]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md font-mono tracking-tight">
                {document.originalFileName}
              </h3>
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                <RelevanceBadge relevance={document.carbonRelevance} />
                {document.reviewStatus === 'REQUIRED' ? (
                  <ReviewStatusBadge status="REQUIRED" />
                ) : (
                  <ProcessingStatusBadge status={document.processingStatus} />
                )}
                <ScopeBadge scope={scope} />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {isDataUnclearOrUndiscoverable && (
              <>
                <button
                  type="button"
                  onClick={() => onTriggerReupload(document)}
                  className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#142d1f] hover:bg-[#1b3d2b] text-[#b5f568] border border-[#b5f568]/50 shadow-[0_0_12px_rgba(181,245,104,0.2)] transition cursor-pointer"
                  title="Upload a clearer file replacement"
                >
                  <Upload className="w-3.5 h-3.5 text-[#b5f568]" />
                  <span>Re-upload Clearer</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerReprocess(document)}
                  className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#0d2218] hover:bg-[#143324] text-[#62dd9e] hover:text-white border border-[#62dd9e]/40 transition cursor-pointer"
                  title="Re-run automated extraction"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#62dd9e]" />
                  <span>Re-extract</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#9aada2] hover:text-white hover:bg-white/[0.08] transition cursor-pointer"
              aria-label="Close review dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-[#05110c]">
          {/* Left Column: Original Document Preview (6 cols) */}
          <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-[#62dd9e]/20 p-4 sm:p-5 bg-[#030c08] flex flex-col overflow-y-auto min-h-0 space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#62dd9e]/20 text-xs font-mono text-[#9aada2]">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-[#62dd9e]" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">Technical Document Preview</span>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#b5f568] hover:underline flex items-center space-x-1 text-[11px] font-mono font-medium"
              >
                <span>Open in new tab</span>
                <ExternalLink className="w-3 h-3 text-[#b5f568]" />
              </a>
            </div>

            {/* Document Preview Frame: SHARP EDGES FOR THIS SITUATION */}
            <div className="flex-1 flex items-center justify-center min-h-[380px] bg-[#020704] rounded-none border-2 border-[#62dd9e]/40 shadow-[0_0_24px_rgba(98,221,158,0.15)] p-0 overflow-hidden relative group">
              {/* Corner Reticle Accents for Technical Drafting Effect */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#b5f568] z-10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#b5f568] z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#b5f568] z-10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#b5f568] z-10 pointer-events-none" />

              {isImage ? (
                <img
                  src={previewUrl}
                  alt={document.originalFileName}
                  className="max-h-[520px] w-auto max-w-full object-contain rounded-none block"
                />
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-[520px] rounded-none border-0 bg-white block"
                />
              ) : (
                <div className="text-center p-8 text-[#9aada2] text-xs font-mono">
                  <FileText className="w-12 h-12 text-[#62dd9e]/40 mx-auto mb-2" />
                  <p>Document preview not supported for {document.mimeType}.</p>
                  <p className="mt-1 text-[#71857c]">Inspect parsed contents in the Raw Extracted Text tab.</p>
                </div>
              )}
            </div>

            {/* Classification explanation */}
            {document.classificationReason && (
              <div className="p-3.5 rounded-xl bg-[#092217] border border-[#62dd9e]/30 text-xs text-[#d8e6de] shadow-sm shrink-0">
                <div className="flex items-center space-x-1.5 text-[#b5f568] font-mono font-bold uppercase tracking-wider text-[11px] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#b5f568]" />
                  <span>Classification Determination</span>
                </div>
                <p className="leading-relaxed text-[#a8bcaf]">{document.classificationReason}</p>
              </div>
            )}
          </div>

          {/* Right Column: Editable Extracted Fields & Validation (6 cols) */}
          <div className="lg:col-span-6 p-4 sm:p-6 overflow-y-auto min-h-0 space-y-4 bg-[#071911]">
            {/* Tab Selector */}
            <div className="flex space-x-2 border-b border-[#62dd9e]/20 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('FIELDS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'FIELDS'
                    ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/50 shadow-[0_0_14px_rgba(181,245,104,0.25)]'
                    : 'text-[#9aada2] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Extracted Fields & Verification
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('TEXT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'TEXT'
                    ? 'bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/50 shadow-[0_0_14px_rgba(181,245,104,0.25)]'
                    : 'text-[#9aada2] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                Raw Extracted Text
              </button>
            </div>

            {/* Permanent Decision Lock Banner */}
            {isPermanentlyReviewed && (
              <div className="p-3.5 rounded-xl bg-[#0d261a] border border-[#62dd9e]/40 text-[#d8e6de] text-xs font-mono flex items-center space-x-2.5 shadow-sm">
                <Lock className="w-4 h-4 text-[#62dd9e] shrink-0" />
                <span>
                  This document has been permanently <strong>{document.reviewStatus}</strong>. Decisions cannot be altered.
                </span>
              </div>
            )}

            {/* Unified Verification Advisory Alert Banner */}
            {!isPermanentlyReviewed && (isDataUnclearOrUndiscoverable || validationErrors.length > 0) && (
              <div className="p-4 rounded-xl bg-[#14281c] border border-amber-500/50 text-amber-200 text-xs shadow-lg space-y-2.5 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-amber-300 font-mono tracking-tight uppercase text-[11px]">
                        Verification Advisory
                      </div>
                      <p className="text-amber-200/85 text-[11px] mt-0.5 leading-relaxed">
                        Review highlighted activity fields below. If the scan is blurry or skewed, upload a clearer replacement or re-run autonomous extraction.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 sm:hidden">
                    <button
                      type="button"
                      onClick={() => onTriggerReupload(document)}
                      className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      title="Re-upload"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/95 pl-1 font-mono">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-[#260e12] border border-rose-500/50 text-rose-200 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            {activeTab === 'FIELDS' ? (
              <fieldset disabled={isPermanentlyReviewed} className="space-y-4 disabled:opacity-75">
                {/* Category & Scope Selector Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      Activity Category <span className="text-[#b5f568]">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                    >
                      <option value="ELECTRICITY">Electricity / Power (Scope 2)</option>
                      <option value="FUEL">Stationary / Mobile Fuel (Scope 1)</option>
                      <option value="TRANSPORTATION">Transportation & Freight (Scope 1 / 3)</option>
                      <option value="WASTE">Waste & Disposal (Scope 3)</option>
                      <option value="SUPPLIER_INVOICE">General Supplier Invoice / Spend</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      GHG Protocol Scope <span className="text-[#b5f568]">*</span>
                    </label>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-[#b5f568] font-bold focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                    >
                      <option value="SCOPE_1">Scope 1 (Direct Fuel / Fleet Emissions)</option>
                      <option value="SCOPE_2">Scope 2 (Indirect Electricity Emissions)</option>
                      <option value="SCOPE_3">Scope 3 (Supply Chain, Freight, Waste)</option>
                    </select>
                  </div>
                </div>

                {/* Date & Quantity Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      Activity Date / Period <span className="text-[#b5f568]">*</span>
                    </label>
                    <input
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      Quantity & Unit <span className="text-[#b5f568]">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 1450"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-2/3 px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                      />
                      <input
                        type="text"
                        placeholder="kWh, L"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-1/3 px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-[#b5f568] font-bold uppercase focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Supplier & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      Supplier / Vendor Name {category === 'SUPPLIER_INVOICE' && <span className="text-[#b5f568]">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tata Power / Indian Oil"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      Description / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Factory monthly consumption"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Category-Specific Dynamic Fields */}
                {category === 'FUEL' && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      Fuel Type <span className="text-[#b5f568]">*</span>
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                    >
                      <option value="">Select fuel type...</option>
                      <option value="Diesel">Diesel (High Speed Diesel)</option>
                      <option value="Petrol / Gasoline">Petrol / Gasoline</option>
                      <option value="Natural Gas (CNG)">Natural Gas (CNG)</option>
                      <option value="LPG">LPG</option>
                      <option value="Heavy Fuel Oil">Furnace Oil / HFO</option>
                    </select>
                  </div>
                )}

                {category === 'TRANSPORTATION' && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                      Transportation Mode <span className="text-[#b5f568]">*</span>
                    </label>
                    <select
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                    >
                      <option value="">Select mode...</option>
                      <option value="Road / Truck">Road Freight / Truck</option>
                      <option value="Air Freight">Air Freight</option>
                      <option value="Sea Freight">Sea Freight</option>
                      <option value="Rail">Rail Cargo</option>
                    </select>
                  </div>
                )}

                {category === 'WASTE' && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                        Waste Type <span className="text-[#b5f568]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hazardous, Scrap"
                        value={wasteType}
                        onChange={(e) => setWasteType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-1.5 font-semibold">
                        Disposal Method
                      </label>
                      <select
                        value={disposalMethod}
                        onChange={(e) => setDisposalMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-xs font-mono text-white focus:outline-none focus:border-[#b5f568] focus:ring-2 focus:ring-[#b5f568]/40 transition-all disabled:opacity-50"
                      >
                        <option value="Landfill">Landfill</option>
                        <option value="Recycled">Recycled</option>
                        <option value="Incineration">Incineration</option>
                        <option value="Composted">Composted</option>
                      </select>
                    </div>
                  </div>
                )}
              </fieldset>
            ) : (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#7dd9a3] mb-2 font-semibold">
                  Raw Extracted Text (Autonomous OCR)
                </label>
                <textarea
                  readOnly
                  value={document.extractedText || 'No text content available.'}
                  rows={12}
                  className="w-full p-3.5 rounded-xl bg-[#030c08] font-mono text-xs text-[#d8e6de] border border-[#62dd9e]/30 focus:outline-none leading-relaxed"
                />
              </div>
            )}

            {/* SUGGESTED CARBON EMISSIONS PANEL */}
            <div
              className={`rounded-2xl border-2 p-4 sm:p-5 shadow-xl transition-all duration-300 relative overflow-hidden shrink-0 ${
                suggestedEmissions?.isNegativeOffset
                  ? 'border-[#62dd9e] bg-gradient-to-br from-[#0e2a1d] to-[#06140e]'
                  : 'border-[#62dd9e]/40 bg-gradient-to-br from-[#0a2317] via-[#071910] to-[#040d08]'
              }`}
            >
              {/* Top rim */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b5f568] to-transparent" />

              {/* Panel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#62dd9e]/20 mb-3">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`p-2 rounded-xl border ${
                      suggestedEmissions?.isNegativeOffset
                        ? 'bg-[#0f2d1e] border-[#62dd9e]/50 text-[#62dd9e]'
                        : 'bg-[#102d1e] border-[#b5f568]/50 text-[#b5f568] shadow-[0_0_12px_rgba(181,245,104,0.3)]'
                    }`}
                  >
                    {getCategoryIcon()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 font-mono">
                      <span>Suggested Carbon Footprint</span>
                    </h4>
                    <p className="text-[10px] text-[#7dd9a3] font-mono">
                      {suggestedEmissions?.standard || 'GHG Protocol & CEA India Baseline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {suggestedEmissions?.isNegativeOffset ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#122b1f] text-[#62dd9e] border border-[#62dd9e]/40">
                      Avoided Emissions
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#102d1e] text-[#d8e6de] border border-[#62dd9e]/30">
                      {suggestedEmissions?.tier || 'IPCC Tier 1'}
                    </span>
                  )}
                  <ScopeBadge scope={scope} />
                </div>
              </div>

              {/* Main Emission Metric */}
              {suggestedEmissions?.isValid ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#b5f568] drop-shadow-[0_0_12px_rgba(181,245,104,0.3)]">
                        {(suggestedEmissions?.emissionsKg || 0) > 0
                          ? `+${Number(suggestedEmissions?.emissionsKg || 0).toLocaleString()}`
                          : Number(suggestedEmissions?.emissionsKg || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-[#b5f568] font-mono">kg CO₂e</span>
                      <span className="text-xs text-[#7dd9a3] font-mono">
                        ({(suggestedEmissions?.emissionsTonnes || 0) > 0
                          ? `+${suggestedEmissions.emissionsTonnes}`
                          : (suggestedEmissions?.emissionsTonnes || 0)} tCO₂e)
                      </span>
                    </div>

                    {suggestedEmissions.isNegativeOffset ? (
                      <div className="text-[11px] font-mono text-[#62dd9e] flex items-center space-x-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Net footprint offset</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#7dd9a3] font-mono">
                        Factor:{' '}
                        <span className="text-white font-semibold">
                          {suggestedEmissions.factorUsed} {suggestedEmissions.factorUnit}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Formula Pill */}
                  <div className="px-3.5 py-2 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 text-[11px] font-mono text-[#d8e6de] flex items-center justify-between gap-2 overflow-x-auto">
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-3.5 h-3.5 text-[#b5f568] shrink-0" />
                      <span className="text-[#7dd9a3]">Formula:</span>
                      <span className="text-[#b5f568] font-medium">{suggestedEmissions.formula}</span>
                    </div>
                  </div>

                  {/* Layer 2 EEIO Breakdown (Direct vs Upstream) */}
                  {suggestedEmissions.directKg != null && suggestedEmissions.upstreamKg != null && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2.5 rounded-xl bg-[#030c08] border border-[#62dd9e]/30">
                      <div className="flex flex-col">
                        <span className="text-[#71857c] text-[10px]">Direct Sector Footprint:</span>
                        <span className="text-[#38bdf8] font-semibold">{Number(suggestedEmissions.directKg).toLocaleString()} kg CO₂e</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#71857c] text-[10px]">Upstream Leontief Tier N:</span>
                        <span className="text-[#62dd9e] font-semibold">{Number(suggestedEmissions.upstreamKg).toLocaleString()} kg CO₂e</span>
                      </div>
                    </div>
                  )}

                  {/* Layer 3 LCA Refinement Hotspot Alert */}
                  {suggestedEmissions.isHotspotCandidate && (
                    <div className="flex items-start space-x-2 text-[11px] text-amber-300 bg-[#14281c] border border-amber-500/50 p-2.5 rounded-xl font-mono">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-amber-200">Layer 3 LCA Refinement Hotspot Candidate</div>
                        <div className="text-[10px] text-amber-300/80 mt-0.5 leading-snug">
                          This spend item exceeds Scope 3 Pareto thresholds. Replace financial proxy with supplier EPD (Environmental Product Declaration) or Bill of Materials when available.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sustainability Insight / Tip */}
                  {suggestedEmissions.insights && !suggestedEmissions.isHotspotCandidate && (
                    <div className="flex items-start space-x-2 text-[11px] text-[#7dd9a3] bg-[#0c2419] border border-[#62dd9e]/30 px-3 py-2 rounded-xl font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-[#b5f568] shrink-0 mt-0.5" />
                      <span className="leading-snug">{suggestedEmissions.insights}</span>
                    </div>
                  )}
                  {/* Expandable Methodology Drawer */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setDetailsExpanded(!detailsExpanded)}
                      className="text-[10px] font-mono text-[#7dd9a3] hover:text-white flex items-center space-x-1 transition cursor-pointer"
                    >
                      <span>Statutory Factor Provenance & IPCC Alignment</span>
                      {detailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {detailsExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-[#030c08] border border-[#62dd9e]/30 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-[#71857c] block">Authoritative Source:</span>
                          <span className="text-[#d8e6de] font-medium">{suggestedEmissions.sourceName}</span>
                        </div>
                        <div>
                          <span className="text-[#71857c] block">Accounting Tier:</span>
                          <span className="text-[#d8e6de] font-medium">{suggestedEmissions.tier}</span>
                        </div>
                        <div>
                          <span className="text-[#71857c] block">Applicable Standard:</span>
                          <span className="text-[#d8e6de] font-medium">{suggestedEmissions.standard}</span>
                        </div>
                        <div>
                          <span className="text-[#71857c] block">Ledger Target:</span>
                          <span className="text-[#62dd9e] font-medium flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3 text-[#62dd9e]" />
                            <span>Verified Sovereign ESG Activity Record</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-xs text-[#7dd9a3] py-1 font-mono">
                  <Info className="w-4 h-4 text-[#b5f568] shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    Enter activity quantity (e.g.{' '}
                    <strong className="text-white">518 kWh</strong> for electricity,{' '}
                    <strong className="text-white">100 Liters</strong> for fuel) to view real-time statutory carbon emissions calculated against national baselines.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer: Full-Width Pinned Footer Bar */}
        <div className="p-4 sm:px-6 border-t-2 border-[#62dd9e]/30 bg-[#091f16] flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
          <div className="flex items-center space-x-2.5">
            {isPermanentlyReviewed ? (
              <div className="flex items-center space-x-2 text-[#7dd9a3] text-xs font-mono mr-2">
                <Lock className="w-3.5 h-3.5 text-[#62dd9e]" />
                <span>Permanent status: <strong className="text-white">{document.reviewStatus}</strong></span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleReject}
                disabled={saving}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#2b0d11] hover:bg-[#3d1318] text-[#fca5a5] border border-rose-500/40 text-xs font-mono font-bold transition cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Document</span>
              </button>
            )}

            {/* Individual Document Verification Certificate (PDF) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#12281e] hover:bg-[#1a382b] text-[#b5f568] hover:text-white border border-[#b5f568]/40 hover:border-[#b5f568] text-xs font-mono font-semibold transition shadow-md cursor-pointer"
              title="Download Individual Document GHG Verification Certificate (PDF)"
            >
              {downloadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#b5f568]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#b5f568]" />
              )}
              <span>Audit Certificate (PDF)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-[#0d2218] hover:bg-[#143324] text-[#d8e6de] hover:text-white border border-[#62dd9e]/30 text-xs font-mono font-medium transition cursor-pointer"
            >
              {isPermanentlyReviewed ? 'Close' : 'Cancel'}
            </button>
            {!isPermanentlyReviewed && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#b5f568] to-[#62dd9e] hover:from-[#c5fa82] hover:to-[#73e8ac] text-[#05110c] hover:shadow-[0_0_28px_rgba(181,245,104,0.5)] hover:scale-[1.02] active:scale-[0.98] text-xs font-mono font-extrabold transition shadow-md cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#05110c]" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-[#05110c]" />
                    <span>Verify & Record Activity</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentReviewModal;
