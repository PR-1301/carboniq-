import React, { useState, useRef } from 'react';
import { Upload, File, FileArchive, X, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { uploadDocumentFiles, uploadZipArchive } from '../services/api.js';

const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.zip'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100 MB

export function UploadZone({ onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFiles = (fileList) => {
    const valid = [];
    const errors = [];

    Array.from(fileList).forEach((file) => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        errors.push(`${file.name}: Unsupported format. Allowed: PDF, JPG, PNG, CSV, XLSX, ZIP.`);
        return;
      }

      if (ext === '.zip' && file.size > MAX_ZIP_SIZE) {
        errors.push(`${file.name}: ZIP archive exceeds maximum allowed size (100MB).`);
        return;
      }

      if (ext !== '.zip' && file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File exceeds maximum allowed size (25MB).`);
        return;
      }

      valid.push(file);
    });

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    } else {
      setUploadError(null);
    }

    return valid;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const valid = validateFiles(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const valid = validateFiles(e.target.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setUploadError(null);
    setUploadResult(null);
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      // Check if there is a ZIP file
      const zipFiles = selectedFiles.filter((f) => f.name.toLowerCase().endsWith('.zip'));
      const normalFiles = selectedFiles.filter((f) => !f.name.toLowerCase().endsWith('.zip'));

      let totalDocs = 0;
      let totalDuplicates = 0;
      let totalFailed = 0;

      // Handle normal documents
      if (normalFiles.length > 0) {
        const res = await uploadDocumentFiles(normalFiles);
        if (!res.success) {
          throw new Error(res.error || 'Failed to upload documents');
        }
        totalDocs += res.documents?.length || 0;
        totalDuplicates += res.batch?.duplicateFiles || 0;
        totalFailed += res.batch?.failedFiles || 0;
      }

      // Handle zip files individually
      for (const zip of zipFiles) {
        const res = await uploadZipArchive(zip);
        if (!res.success) {
          throw new Error(res.error || `Failed to process ${zip.name}`);
        }
        totalDocs += res.documents?.length || 0;
        totalDuplicates += res.batch?.duplicateFiles || 0;
        totalFailed += res.batch?.failedFiles || 0;
      }

      setUploadResult({
        message: `Batch processed: ${totalDocs} document(s) imported.`,
        duplicates: totalDuplicates,
        failed: totalFailed,
      });

      setSelectedFiles([]);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      setUploadError(err.message || 'Error occurred during file upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Document Ingestion & Upload</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload electricity bills, fuel receipts, logistics sheets, waste manifests, or audit documents.
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition"
          >
            <FileArchive className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload ZIP Archive</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-emerald-500 bg-emerald-950/20 shadow-inner'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.zip"
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={zipInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Drag and drop business documents here, or <span className="text-emerald-400 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PDF, PNG, JPG, CSV, Excel (XLSX), and ZIP archives
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Max 25MB / file</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">Max 100MB / ZIP</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono">SHA-256 Deduplication</span>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {uploadError && (
        <div className="mt-4 p-3.5 rounded-lg bg-red-950/60 border border-red-700/60 text-red-200 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div className="whitespace-pre-wrap">{uploadError}</div>
        </div>
      )}

      {uploadResult && (
        <div className="mt-4 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadResult.message}</span>
            {uploadResult.duplicates > 0 && (
              <span className="text-purple-300 ml-1">({uploadResult.duplicates} duplicates detected)</span>
            )}
            {uploadResult.failed > 0 && (
              <span className="text-rose-300 ml-1">({uploadResult.failed} failed)</span>
            )}
          </div>
          <button onClick={() => setUploadResult(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected File Queue */}
      {selectedFiles.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 px-1 font-medium">
            <span>Selected Files ({selectedFiles.length})</span>
            <button
              onClick={clearSelection}
              disabled={uploading}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs"
              >
                <div className="flex items-center space-x-2.5 truncate max-w-[80%]">
                  {file.name.endsWith('.zip') ? (
                    <FileArchive className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <File className="w-4 h-4 text-blue-400 shrink-0" />
                  )}
                  <span className="text-slate-200 truncate font-mono">{file.name}</span>
                  <span className="text-slate-500 shrink-0">
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  disabled={uploading}
                  className="text-slate-400 hover:text-rose-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleStartUpload}
              disabled={uploading || selectedFiles.length === 0}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                uploading
                  ? 'bg-emerald-800 text-emerald-200 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
              }`}
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Documents...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Start Processing ({selectedFiles.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
