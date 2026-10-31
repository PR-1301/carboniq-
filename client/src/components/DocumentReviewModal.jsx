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
  Leaf,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { getPreviewUrl, submitDocumentReview } from '../services/api.js';
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
  const [errorMessage, setErrorMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('FIELDS'); // 'FIELDS' | 'TEXT' | 'PREVIEW'

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

  const [suggestedEmissions, setSuggestedEmissions] = useState(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Dynamically recalculate suggested carbon emissions according to CARBON_EMISSION_CALCULATION_METHODS.md
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
    });
    setSuggestedEmissions(calc);
  }, [category, scope, quantity, unit, fuelType, transportMode, wasteType, disposalMethod, supplierName]);

  const getCategoryIcon = () => {
    if (category === 'WASTE') {
      return disposalMethod === 'Recycled' ? (
        <Recycle className="w-4 h-4 text-emerald-400" />
      ) : (
        <Recycle className="w-4 h-4 text-purple-400" />
      );
    }
    if (category === 'FUEL') return <Flame className="w-4 h-4 text-orange-400" />;
    if (category === 'TRANSPORTATION') return <Truck className="w-4 h-4 text-sky-400" />;
    if (category === 'ELECTRICITY') return <Zap className="w-4 h-4 text-amber-400" />;
    return <Calculator className="w-4 h-4 text-emerald-400" />;
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
        setErrorMessage(res.error || 'Failed to approve document');
        if (res.validationErrors) {
          setValidationErrors(res.validationErrors);
        }
        return;
      }

      if (onSaved) onSaved(res.document);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error saving document review');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white truncate max-w-md">
                {document.originalFileName}
              </h3>
              <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                <RelevanceBadge relevance={document.carbonRelevance} />
                <ProcessingStatusBadge status={document.processingStatus} />
                <ReviewStatusBadge status={document.reviewStatus} />
                <ScopeBadge scope={scope} />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isDataUnclearOrUndiscoverable && (
              <>
                <button
                  onClick={() => onTriggerReupload(document)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-600/60 transition shadow-sm"
                  title="Document data is unclear or missing. Upload a clearer replacement."
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Re-upload Clearer</span>
                </button>
                <button
                  onClick={() => onTriggerReprocess(document)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Data not discovered. Re-run automated extraction."
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-extract</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Original Document Preview (5 cols) */}
          <div className="lg:col-span-6 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 bg-slate-950/50 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs text-slate-400 font-medium">
              <div className="flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Original Document Preview</span>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Open in new tab</span>
              </a>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[350px] bg-slate-900 rounded-xl border border-slate-800 p-2 overflow-hidden">
              {isImage ? (
                <img
                  src={previewUrl}
                  alt={document.originalFileName}
                  className="max-h-[500px] w-auto max-w-full object-contain rounded"
                />
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  className="w-full h-[520px] rounded border border-slate-700"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p>Document preview not supported for {document.mimeType}.</p>
                  <p className="mt-1 text-slate-500">Inspect extracted tabular contents in the Extracted Text tab.</p>
                </div>
              )}
            </div>

            {/* Classification explanation */}
            {document.classificationReason && (
              <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">Classification Determination:</span>
                {document.classificationReason}
              </div>
            )}
          </div>

          {/* Right Column: Editable Extracted Fields & Validation (6 cols) */}
          <div className="lg:col-span-6 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-4">
            <div>
              {/* Tab Selector */}
              <div className="flex space-x-2 border-b border-slate-800 pb-2 mb-4">
                <button
                  onClick={() => setActiveTab('FIELDS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'FIELDS'
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Extracted Fields & Verification
                </button>
                <button
                  onClick={() => setActiveTab('TEXT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'TEXT'
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Extracted Text
                </button>
              </div>

              {/* Permanent Decision Lock Banner */}
              {isPermanentlyReviewed && (
                <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-xs flex items-center space-x-2.5 mb-4 shadow-inner">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    This document has been permanently <strong>{document.reviewStatus}</strong>. Decisions cannot be altered or re-evaluated.
                  </span>
                </div>
              )}

              {/* Unclear or Undiscoverable Data Alert Banner */}
              {!isPermanentlyReviewed && isDataUnclearOrUndiscoverable && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold flex items-center space-x-1.5 text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Data Unclear or Not Discovered</span>
                      </div>
                      <p className="text-amber-200/80 text-[11px] leading-relaxed">
                        Required activity quantities could not be reliably extracted. If the original file is blurry or skewed, you can upload a clearer replacement or retry AI extraction.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onTriggerReupload(document)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition shadow-sm"
                        title="Upload a clearer file replacement"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Re-upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onTriggerReprocess(document)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-medium text-xs transition"
                        title="Retry extraction"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-extract</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Warnings Alert */}
              {!isPermanentlyReviewed && validationErrors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-700/60 text-amber-200 text-xs space-y-1 mb-4">
                  <div className="font-semibold flex items-center space-x-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>User Verification Required:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 pl-1">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-700 text-red-200 text-xs mb-4">
                  {errorMessage}
                </div>
              )}

              {activeTab === 'FIELDS' ? (
                <fieldset disabled={isPermanentlyReviewed} className="space-y-3.5 disabled:opacity-80">
                  {/* Category & Scope Selector Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Activity Category <span className="text-emerald-400">*</span>
                      </label>
                      <select
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                      >
                        <option value="ELECTRICITY">Electricity / Power (Scope 2)</option>
                        <option value="FUEL">Stationary / Mobile Fuel (Scope 1)</option>
                        <option value="TRANSPORTATION">Transportation & Freight (Scope 1 / 3)</option>
                        <option value="WASTE">Waste & Disposal (Scope 3)</option>
                        <option value="SUPPLIER_INVOICE">General Supplier Invoice / Spend</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        GHG Protocol Scope <span className="text-emerald-400">*</span>
                      </label>
                      <select
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                      >
                        <option value="SCOPE_1">Scope 1 (Direct Fuel / Fleet Emissions)</option>
                        <option value="SCOPE_2">Scope 2 (Indirect Electricity Emissions)</option>
                        <option value="SCOPE_3">Scope 3 (Supply Chain, Freight, Waste)</option>
                      </select>
                    </div>
                  </div>

                  {/* Date & Quantity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Activity Date / Billing Period <span className="text-emerald-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={activityDate}
                        onChange={(e) => setActivityDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Quantity <span className="text-emerald-400">*</span>
                      </label>
                      <div className="flex space-x-1.5">
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 1450"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-2/3 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                        />
                        <input
                          type="text"
                          placeholder="Unit (kWh, L)"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-1/3 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 uppercase font-mono disabled:bg-slate-900 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Supplier & Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Supplier / Vendor Name {category === 'SUPPLIER_INVOICE' && <span className="text-emerald-400">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tata Power / Indian Oil"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Description / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Factory monthly consumption"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Category-Specific Fields */}
                  {category === 'FUEL' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Fuel Type <span className="text-emerald-400">*</span>
                      </label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                      >
                        <option value="">Select fuel type...</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Petrol / Gasoline">Petrol / Gasoline</option>
                        <option value="Natural Gas (CNG)">Natural Gas (CNG)</option>
                        <option value="LPG">LPG</option>
                        <option value="Heavy Fuel Oil">Heavy Fuel Oil</option>
                      </select>
                    </div>
                  )}

                  {category === 'TRANSPORTATION' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Transportation Mode <span className="text-emerald-400">*</span>
                      </label>
                      <select
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                      >
                        <option value="">Select mode...</option>
                        <option value="Road / Truck">Road / Truck</option>
                        <option value="Air Freight">Air Freight</option>
                        <option value="Sea Freight">Sea Freight</option>
                        <option value="Rail">Rail</option>
                      </select>
                    </div>
                  )}

                  {category === 'WASTE' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Waste Type <span className="text-emerald-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Hazardous, Scrap, Cardboard"
                          value={wasteType}
                          onChange={(e) => setWasteType(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Disposal Method</label>
                        <select
                          value={disposalMethod}
                          onChange={(e) => setDisposalMethod(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:bg-slate-900 disabled:cursor-not-allowed"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Raw Extracted Text (Method: {document.extractionMethod})
                  </label>
                  <textarea
                    readOnly
                    value={document.extractedText || 'No text content available.'}
                    rows={12}
                    className="w-full p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* SUGGESTED CARBON EMISSIONS PANEL (per CARBON_EMISSION_CALCULATION_METHODS.md) */}
            {/* ============================================================== */}
            <div
              className={`rounded-xl border p-3.5 sm:p-4 shadow-xl transition-all duration-200 relative overflow-hidden ${
                suggestedEmissions?.isNegativeOffset
                  ? 'border-emerald-500/60 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950'
                  : 'border-slate-700/80 bg-gradient-to-br from-slate-900/95 via-slate-900 to-emerald-950/20'
              }`}
            >
              {/* Decorative background glow */}
              <div
                className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
                  suggestedEmissions?.isNegativeOffset ? 'bg-emerald-500/20' : 'bg-cyan-500/10'
                }`}
              />

              {/* Panel Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2.5">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      suggestedEmissions?.isNegativeOffset
                        ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800/80 border-slate-700 text-emerald-400'
                    }`}
                  >
                    {getCategoryIcon()}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white flex items-center space-x-1.5">
                      <span>Suggested Carbon Emissions</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        (from uploaded document)
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {suggestedEmissions?.standard || 'GHG Protocol / CEA 2024 Accounting Standard'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {suggestedEmissions?.isNegativeOffset ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Avoided Emissions Offset
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      {suggestedEmissions?.tier || 'IPCC Tier 1'}
                    </span>
                  )}
                  <ScopeBadge scope={scope} />
                </div>
              </div>

              {/* Main Emission Metric */}
              {suggestedEmissions?.isValid ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <div className="flex items-baseline space-x-2">
                      <span
                        className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                          suggestedEmissions.isNegativeOffset
                            ? 'text-emerald-400'
                            : 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300'
                        }`}
                      >
                        {suggestedEmissions.emissionsKg > 0 ? `+${suggestedEmissions.emissionsKg.toLocaleString()}` : suggestedEmissions.emissionsKg.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-slate-300">kg CO₂e</span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({suggestedEmissions.emissionsTonnes > 0 ? `+${suggestedEmissions.emissionsTonnes}` : suggestedEmissions.emissionsTonnes} tCO₂e)
                      </span>
                    </div>

                    {suggestedEmissions.isNegativeOffset ? (
                      <div className="text-[11px] font-medium text-emerald-300 flex items-center space-x-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Net footprint reduction / carbon credit</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400">
                        Factor: <span className="text-slate-200 font-mono">{suggestedEmissions.factorUsed} {suggestedEmissions.factorUnit}</span>
                      </div>
                    )}
                  </div>

                  {/* Formula Pill */}
                  <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between gap-2 overflow-x-auto">
                    <div className="flex items-center space-x-1.5">
                      <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-400">Formula:</span>
                      <span className="text-emerald-300">{suggestedEmissions.formula}</span>
                    </div>
                  </div>

                  {/* Layer 2 EEIO Breakdown (Direct vs Upstream) */}
                  {suggestedEmissions.directKg !== undefined && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px]">Direct Sector Footprint:</span>
                        <span className="text-cyan-300 font-semibold">{suggestedEmissions.directKg.toLocaleString()} kg CO₂e</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-[10px]">Upstream Leontief Tier N:</span>
                        <span className="text-emerald-300 font-semibold">{suggestedEmissions.upstreamKg.toLocaleString()} kg CO₂e</span>
                      </div>
                    </div>
                  )}

                  {/* Layer 3 LCA Refinement Hotspot Alert */}
                  {suggestedEmissions.isHotspotCandidate && (
                    <div className="flex items-start space-x-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-600/40 p-2.5 rounded-lg">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-200">Layer 3 LCA Refinement Hotspot Candidate</div>
                        <div className="text-[10px] text-amber-300/80 mt-0.5 leading-snug">
                          This spend item exceeds Scope 3 Pareto thresholds. Replace financial proxy with supplier EPD (Environmental Product Declaration) or Bill of Materials when available.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sustainability Insight / Tip */}
                  {suggestedEmissions.insights && !suggestedEmissions.isHotspotCandidate && (
                    <div className="flex items-start space-x-2 text-[11px] text-emerald-300/90 bg-emerald-950/20 border border-emerald-800/30 px-2.5 py-1.5 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{suggestedEmissions.insights}</span>
                    </div>
                  )}

                  {/* Expandable Methodology Drawer */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setDetailsExpanded(!detailsExpanded)}
                      className="text-[10px] font-medium text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition"
                    >
                      <span>Methodology & Factor Provenance (CARBON_EMISSION_CALCULATION_METHODS.md)</span>
                      {detailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {detailsExpanded && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Authoritative Source:</span>
                          <span className="text-slate-300 font-medium">{suggestedEmissions.sourceName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Accounting Tier:</span>
                          <span className="text-slate-300 font-medium">{suggestedEmissions.tier}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Applicable Standard:</span>
                          <span className="text-slate-300 font-medium">{suggestedEmissions.standard}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Database Storage:</span>
                          <span className="text-emerald-400 font-medium flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Saved to MongoDB upon approval</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 text-xs text-slate-400 py-1">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enter activity quantity (e.g.{' '}
                    <strong className="text-slate-300">518 kWh</strong> for electricity,{' '}
                    <strong className="text-slate-300">100 Liters</strong> for fuel) to view real-time suggested carbon emissions according to CARBON_EMISSION_CALCULATION_METHODS.md.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              {isPermanentlyReviewed ? (
                <div className="flex items-center space-x-2 text-slate-400 text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permanent status: <strong className="text-white">{document.reviewStatus}</strong></span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={saving}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/60 text-xs font-medium transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Document</span>
                </button>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  {isPermanentlyReviewed ? 'Close' : 'Cancel'}
                </button>
                {!isPermanentlyReviewed && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={saving}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/50 transition"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve & Save to MongoDB</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
