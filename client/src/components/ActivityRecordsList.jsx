import React, { useState } from 'react';
import { Layers, FileText, UserCheck, Calendar, Filter, Search } from 'lucide-react';
import { ScopeBadge } from './StatusBadge.jsx';

export function ActivityRecordsList({ activities, loading, onSelectDocumentById }) {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = activities.filter((act) => {
    if (categoryFilter && act.category !== categoryFilter) return false;
    if (scopeFilter && act.scope !== scopeFilter) return false;
    if (sourceFilter && act.recordSource !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchSupp = act.supplierName?.toLowerCase().includes(q);
      const matchDesc = act.description?.toLowerCase().includes(q);
      const matchDoc = act.documentId?.originalFileName?.toLowerCase().includes(q);
      if (!matchSupp && !matchDesc && !matchDoc) return false;
    }
    return true;
  });

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Stored Activity Records</h2>
          <p className="text-xs text-slate-400">
            Approved structured records persisted in MongoDB ready for subsequent emissions calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search supplier or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-48"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="FUEL">Fuel</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="WASTE">Waste</option>
            <option value="SUPPLIER_INVOICE">Supplier Invoices</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="">All Scopes</option>
            <option value="SCOPE_1">Scope 1</option>
            <option value="SCOPE_2">Scope 2</option>
            <option value="SCOPE_3">Scope 3</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Sources</option>
            <option value="EXTRACTED">Extracted from Document</option>
            <option value="MANUAL">Direct Manual Entry</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading activity records...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-medium text-sm">No activity records stored yet</p>
          <p className="text-slate-500 text-xs mt-1">
            Review and approve uploaded documents or use the Manual Entry tab to create records.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px] bg-slate-900/40">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Scope</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Emissions (kg CO₂e)</th>
                <th className="py-3 px-3">Supplier / Description</th>
                <th className="py-3 px-3">Source & Traceability</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 font-mono">
              {filtered.map((act) => {
                const dateStr = act.activityDate ? new Date(act.activityDate).toLocaleDateString() : 'N/A';
                const hasEmissions = act.carbonEmissions && act.carbonEmissions.emissionsKg != null;
                const isOffset = act.carbonEmissions?.isNegativeOffset;

                return (
                  <tr key={act._id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-3 text-slate-300 font-sans">{dateStr}</td>
                    <td className="py-3 px-3">
                      <ScopeBadge scope={act.scope} />
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="font-semibold text-slate-200">{act.category}</span>
                      {act.categoryData?.fuelType && (
                        <span className="block text-[11px] text-slate-400">{act.categoryData.fuelType}</span>
                      )}
                      {act.categoryData?.transportMode && (
                        <span className="block text-[11px] text-slate-400">{act.categoryData.transportMode}</span>
                      )}
                      {act.categoryData?.wasteType && (
                        <span className="block text-[11px] text-slate-400">{act.categoryData.wasteType}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400 font-bold text-sm">{act.quantity}</span>{' '}
                      <span className="text-slate-300">{act.unit}</span>
                    </td>
                    <td className="py-3 px-3">
                      {hasEmissions ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            isOffset
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/50'
                              : 'bg-slate-900 text-teal-300 border border-slate-700'
                          }`}
                          title={act.carbonEmissions.calculationFormula || 'Calculated emissions'}
                        >
                          {act.carbonEmissions.emissionsKg > 0 ? `+${act.carbonEmissions.emissionsKg}` : act.carbonEmissions.emissionsKg} kg
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans max-w-xs">
                      <div className="font-medium text-slate-200">{act.supplierName || '—'}</div>
                      <div className="text-[11px] text-slate-400 truncate">{act.description}</div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {act.recordSource === 'EXTRACTED' ? (
                        <div className="flex items-center space-x-1.5 text-blue-300">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="text-[11px] truncate max-w-[150px]">
                            {act.documentId?.originalFileName || 'Linked Document'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Manual SME Entry</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                        {act.verificationStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
