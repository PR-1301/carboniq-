import React, { useState } from 'react';
import { PlusCircle, CheckCircle, AlertTriangle, RefreshCw, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { createManualActivity } from '../services/api.js';

export function ManualEntryModal({ onActivityCreated }) {
  const [category, setCategory] = useState('ELECTRICITY');
  const [scope, setScope] = useState('SCOPE_2');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kWh');
  const [supplierName, setSupplierName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Category specific fields
  const [fuelType, setFuelType] = useState('Diesel');
  const [transportMode, setTransportMode] = useState('Road / Truck');
  const [wasteType, setWasteType] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('Landfill');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleCategorySelect = (newCat) => {
    setCategory(newCat);
    setValidationErrors([]);
    setErrorMessage(null);
    switch (newCat) {
      case 'ELECTRICITY':
        setUnit('kWh');
        setScope('SCOPE_2');
        break;
      case 'FUEL':
        setUnit('Liters');
        setScope('SCOPE_1');
        break;
      case 'TRANSPORTATION':
        setUnit('km');
        setScope('SCOPE_3');
        break;
      case 'WASTE':
        setUnit('kg');
        setScope('SCOPE_3');
        break;
      case 'SUPPLIER_INVOICE':
        setUnit('units');
        setScope('SCOPE_3');
        break;
      default:
        setUnit('');
        setScope('SCOPE_3');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setValidationErrors([]);
    setSuccessMessage(null);

    const payload = {
      category,
      scope,
      activityDate: activityDate ? new Date(activityDate) : null,
      quantity: parseFloat(quantity),
      unit: unit.trim(),
      supplierName: supplierName.trim(),
      description: description.trim(),
      notes: notes.trim(),
      categoryData: {
        fuelType: category === 'FUEL' ? fuelType : '',
        transportMode: category === 'TRANSPORTATION' ? transportMode : '',
        wasteType: category === 'WASTE' ? wasteType : '',
        disposalMethod: category === 'WASTE' ? disposalMethod : '',
      },
    };

    try {
      const res = await createManualActivity(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to save manual record.');
        if (res.validationErrors) {
          setValidationErrors(res.validationErrors);
        }
        return;
      }

      setSuccessMessage('Manual carbon activity record persisted to MongoDB successfully.');
      setQuantity('');
      setDescription('');
      setNotes('');
      setWasteType('');

      if (onActivityCreated) onActivityCreated(res.activity);
    } catch (err) {
      setErrorMessage(err.message || 'Error saving activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-700/60 mb-6">
        <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Direct Carbon Activity Entry</h2>
          <p className="text-xs text-slate-400">
            Enter verified operational carbon activities manually without requiring a document upload.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-700 text-red-200 text-xs">
          <div className="font-semibold text-red-300">{errorMessage}</div>
          {validationErrors.length > 0 && (
            <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-red-200/90">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category & Scope */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Select Operational Category <span className="text-emerald-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'ELECTRICITY', label: 'Electricity' },
                { id: 'FUEL', label: 'Fuel' },
                { id: 'TRANSPORTATION', label: 'Transport' },
                { id: 'WASTE', label: 'Waste' },
                { id: 'SUPPLIER_INVOICE', label: 'Invoices' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition text-center ${
                    category === cat.id
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              GHG Protocol Scope <span className="text-emerald-400">*</span>
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="SCOPE_1">Scope 1 (Direct Fuel / Fleet)</option>
              <option value="SCOPE_2">Scope 2 (Electricity / Steam)</option>
              <option value="SCOPE_3">Scope 3 (Supply Chain / Waste)</option>
            </select>
          </div>
        </div>

        {/* Date, Quantity, Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Activity Date <span className="text-emerald-400">*</span>
            </label>
            <input
              type="date"
              required
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Numeric Quantity <span className="text-emerald-400">*</span>
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="e.g. 520"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Measurement Unit <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="kWh, Liters, km, kg"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Category Specific Config */}
        {category === 'FUEL' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Fuel Type <span className="text-emerald-400">*</span>
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Diesel">Diesel</option>
              <option value="Petrol / Gasoline">Petrol / Gasoline</option>
              <option value="Natural Gas (CNG)">Natural Gas (CNG)</option>
              <option value="LPG">LPG (Liquefied Petroleum Gas)</option>
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
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Road / Truck">Road / Truck Logistics</option>
              <option value="Air Freight">Air Freight</option>
              <option value="Sea Freight">Sea / Maritime Container</option>
              <option value="Rail">Rail Cargo</option>
            </select>
          </div>
        )}

        {category === 'WASTE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Waste Type <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Organic, Scrap Metal, Hazardous, Cardboard"
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Disposal Method</label>
              <select
                value={disposalMethod}
                onChange={(e) => setDisposalMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Landfill">Landfill</option>
                <option value="Recycled">Recycled / Reclaimed</option>
                <option value="Incineration">Incineration</option>
                <option value="Composted">Composted</option>
              </select>
            </div>
          </div>
        )}

        {/* Supplier & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Supplier / Contractor Name {category === 'SUPPLIER_INVOICE' && <span className="text-emerald-400">*</span>}
            </label>
            <input
              type="text"
              placeholder="e.g. National Grid / Shell"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Brief Description</label>
            <input
              type="text"
              placeholder="e.g. Facility HVAC power consumption"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Internal Audit Notes</label>
          <textarea
            rows={2}
            placeholder="Audit notes or handwritten sheet reference..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Persisted as verified record in MongoDB ActivityRecords</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to MongoDB...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Save Activity Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
