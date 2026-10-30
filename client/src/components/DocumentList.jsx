import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Edit3,
  RefreshCw,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react';
import { ProcessingStatusBadge, ReviewStatusBadge, RelevanceBadge, ScopeBadge } from './StatusBadge.jsx';

export function DocumentList({
  documents,
  loading,
  onSelectDocument,
  onPreviewDocument,
  onReuploadDocument,
  onReprocessDocument,
}) {
  const [statusFilter, setStatusFilter] = useState('');
  const [relevanceFilter, setRelevanceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter((doc) => {
    if (statusFilter && doc.processingStatus !== statusFilter) return false;
    if (relevanceFilter && doc.carbonRelevance !== relevanceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.originalFileName.toLowerCase().includes(q);
      const matchType = doc.documentType?.toLowerCase().includes(q);
      const matchReason = doc.classificationReason?.toLowerCase().includes(q);
      const matchSupplier = doc.extractedFields?.supplierName?.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchReason && !matchSupplier) return false;
    }
    return true;
  });

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow-xl space-y-5">
      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Ingested Documents</h2>
          <p className="text-xs text-slate-400">
            Total {documents.length} document(s) in local MongoDB database
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search filename or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Relevance filter */}
          <select
            value={relevanceFilter}
            onChange={(e) => setRelevanceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Relevance</option>
            <option value="RELEVANT">Carbon Relevant</option>
            <option value="IRRELEVANT">Irrelevant</option>
            <option value="UNCERTAIN">Uncertain</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Loading ingested documents...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-medium text-sm">No documents found matching filters</p>
          <p className="text-slate-500 text-xs mt-1">Upload business records or clear your filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 uppercase tracking-wider font-semibold text-[11px] bg-slate-900/40">
                <th className="py-3 px-3">Document</th>
                <th className="py-3 px-3">Classification</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Review</th>
                <th className="py-3 px-3">Extracted Summary</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredDocs.map((doc) => {
                const isDuplicate = doc.processingStatus === 'DUPLICATE';
                const isIrrelevant = doc.carbonRelevance === 'IRRELEVANT';
                const hasErrors = doc.validationErrors && doc.validationErrors.length > 0;

                return (
                  <tr
                    key={doc._id}
                    className="hover:bg-slate-700/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectDocument(doc)}
                  >
                    {/* Document Name & Meta */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="flex items-start space-x-2.5">
                        <FileText className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="truncate">
                          <div className="font-medium text-slate-200 truncate" title={doc.originalFileName}>
                            {doc.originalFileName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5 font-mono">
                            <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{doc.extractionMethod}</span>
                            {doc.parentDocumentId && (
                              <span className="text-purple-400">(Replacement)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Classification & Scope */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <RelevanceBadge relevance={doc.carbonRelevance} />
                          {doc.scope && (
                            <ScopeBadge scope={doc.scope} />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {doc.documentType?.replace(/_/g, ' ')}
                        </div>
                        {doc.classificationReason && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs" title={doc.classificationReason}>
                            {doc.classificationReason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Processing Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <ProcessingStatusBadge status={doc.processingStatus} />
                        {hasErrors && (
                          <div className="text-[10px] text-rose-400 flex items-center space-x-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{doc.validationErrors.length} warning(s)</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Review Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <ReviewStatusBadge status={doc.reviewStatus} />
                    </td>

                    {/* Extracted Summary */}
                    <td className="py-3.5 px-3">
                      {isDuplicate ? (
                        <span className="text-purple-300 italic">Identical duplicate file</span>
                      ) : isIrrelevant ? (
                        <span className="text-slate-400 italic">Non-carbon document</span>
                      ) : doc.extractedFields?.quantity ? (
                        <div className="font-mono text-slate-300">
                          <span className="font-bold text-white">{doc.extractedFields.quantity}</span>{' '}
                          <span className="text-emerald-400">{doc.extractedFields.unit}</span>
                          {doc.extractedFields.supplierName && (
                            <span className="block text-slate-400 text-[11px] truncate">
                              {doc.extractedFields.supplierName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-400/80 italic">Unextracted / Missing</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onPreviewDocument(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="Preview Original Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectDocument(doc)}
                          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs transition border ${
                            doc.reviewStatus === 'APPROVED'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                              : doc.reviewStatus === 'REJECTED'
                              ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                              : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60'
                          }`}
                          title={
                            doc.reviewStatus === 'APPROVED' || doc.reviewStatus === 'REJECTED'
                              ? `Permanently ${doc.reviewStatus.toLowerCase()} (Read-only)`
                              : 'Review & Verify Extracted Fields'
                          }
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>
                            {doc.reviewStatus === 'APPROVED' ? 'Approved' : doc.reviewStatus === 'REJECTED' ? 'Rejected' : 'Review'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onReuploadDocument(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 transition"
                          title="Re-upload Clearer Replacement"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onReprocessDocument(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="Reprocess Extraction"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
