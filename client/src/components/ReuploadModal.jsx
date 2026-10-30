import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { reuploadDocumentFile } from '../services/api.js';

export function ReuploadModal({ document, isOpen, onClose, onReuploaded }) {
  if (!isOpen || !document) return null;

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a replacement file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await reuploadDocumentFile(document._id, file);
      if (!res.success) {
        throw new Error(res.error || 'Failed to upload replacement file.');
      }

      if (onReuploaded) onReuploaded(res.document);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Re-upload Clearer Document</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <span className="font-semibold text-amber-300 block mb-0.5">Replacing Unclear / Failed Document:</span>
          <span className="font-mono text-slate-200">{document.originalFileName}</span>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Select higher-resolution image, scanned PDF, or corrected document:
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-950/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            {file ? (
              <div>
                <p className="text-xs font-semibold text-white font-mono">{file.name}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {(file.size / 1024).toFixed(1)} KB - Click to choose different file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-slate-300">Click to select replacement file</p>
                <p className="text-[11px] text-slate-500 mt-1">PDF, JPG, PNG, CSV, XLSX (Max 25MB)</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-700 text-red-200 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || !file}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold text-white transition ${
              uploading || !file
                ? 'bg-emerald-800 cursor-not-allowed opacity-60'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Replacement...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Reprocess</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
