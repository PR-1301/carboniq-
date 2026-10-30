import React from 'react';

export function ProcessingStatusBadge({ status }) {
  const configs = {
    UPLOADED: { bg: 'bg-blue-950/60 text-blue-300 border-blue-700/50', label: 'Uploaded' },
    HASH_CHECK: { bg: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50', label: 'Hash Check' },
    CLASSIFYING: { bg: 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50', label: 'Classifying' },
    EXTRACTING: { bg: 'bg-purple-950/60 text-purple-300 border-purple-700/50', label: 'Extracting' },
    NEEDS_REVIEW: { bg: 'bg-amber-950/60 text-amber-300 border-amber-600/60', label: 'Needs Review' },
    COMPLETED: { bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/60', label: 'Completed' },
    DUPLICATE: { bg: 'bg-violet-950/60 text-violet-300 border-violet-600/60', label: 'Duplicate' },
    REJECTED: { bg: 'bg-rose-950/60 text-rose-300 border-rose-700/60', label: 'Rejected' },
    FAILED: { bg: 'bg-red-950/60 text-red-300 border-red-700/60', label: 'Failed' },
  };

  const config = configs[status] || { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      {config.label}
    </span>
  );
}

export function ReviewStatusBadge({ status }) {
  const configs = {
    PENDING: { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: 'Review Pending' },
    REQUIRED: { bg: 'bg-orange-950/60 text-orange-300 border-orange-700/60 animate-pulse', label: 'Review Required' },
    APPROVED: { bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60', label: 'Approved' },
    REJECTED: { bg: 'bg-rose-950/60 text-rose-300 border-rose-700/60', label: 'Rejected' },
  };

  const config = configs[status] || { bg: 'bg-slate-800 text-slate-300 border-slate-700', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      {config.label}
    </span>
  );
}

export function RelevanceBadge({ relevance }) {
  const configs = {
    RELEVANT: { bg: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50', label: 'Carbon Relevant' },
    IRRELEVANT: { bg: 'bg-slate-800 text-slate-400 border-slate-700', label: 'Irrelevant' },
    UNCERTAIN: { bg: 'bg-yellow-950/60 text-yellow-300 border-yellow-700/50', label: 'Uncertain' },
  };

  const config = configs[relevance] || { bg: 'bg-slate-800 text-slate-400 border-slate-700', label: relevance };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}

export function ScopeBadge({ scope }) {
  const configs = {
    SCOPE_1: { bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/60', label: 'Scope 1' },
    SCOPE_2: { bg: 'bg-sky-950/70 text-sky-300 border-sky-600/60', label: 'Scope 2' },
    SCOPE_3: { bg: 'bg-purple-950/70 text-purple-300 border-purple-600/60', label: 'Scope 3' },
    NOT_APPLICABLE: { bg: 'bg-slate-800 text-slate-400 border-slate-700', label: 'N/A' },
    UNKNOWN: { bg: 'bg-slate-800 text-slate-400 border-slate-700', label: 'Unassigned' },
  };

  const config = configs[scope] || { bg: 'bg-slate-800 text-slate-400 border-slate-700', label: scope || 'Scope ?' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border font-mono ${config.bg}`}>
      {config.label}
    </span>
  );
}
