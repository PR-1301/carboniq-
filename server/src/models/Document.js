import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storedFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    sha256: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      enum: ['UPLOAD', 'ZIP_ENTRY'],
      default: 'UPLOAD',
    },
    archiveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadBatch',
      default: null,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadBatch',
      default: null,
    },
    documentType: {
      type: String,
      enum: [
        'ELECTRICITY_BILL',
        'FUEL_RECEIPT',
        'TRANSPORT_RECORD',
        'WASTE_RECORD',
        'SUPPLIER_INVOICE',
        'AUDIT_SHEET',
        'PAYROLL_SALARY',
        'IRRELEVANT',
        'UNKNOWN',
      ],
      default: 'UNKNOWN',
    },
    carbonRelevance: {
      type: String,
      enum: ['RELEVANT', 'IRRELEVANT', 'UNCERTAIN'],
      default: 'UNCERTAIN',
    },
    scope: {
      type: String,
      enum: ['SCOPE_1', 'SCOPE_2', 'SCOPE_3', 'NOT_APPLICABLE', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    classificationReason: {
      type: String,
      default: '',
    },
    processingStatus: {
      type: String,
      enum: [
        'UPLOADED',
        'HASH_CHECK',
        'CLASSIFYING',
        'EXTRACTING',
        'NEEDS_REVIEW',
        'COMPLETED',
        'DUPLICATE',
        'REJECTED',
        'FAILED',
      ],
      default: 'UPLOADED',
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'REQUIRED', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    extractionMethod: {
      type: String,
      enum: ['GROQ_VISION', 'GROQ_LLM', 'PDF_TEXT', 'OCR_SPACE', 'CSV_PARSER', 'EXCEL_PARSER', 'MANUAL', 'NONE'],
      default: 'NONE',
    },
    extractedText: {
      type: String,
      default: '',
    },
    extractedFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    fieldConfidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    validationErrors: {
      type: [String],
      default: [],
    },
    parentDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    supersededBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    suggestedEmissions: {
      emissionsKg: { type: Number, default: null },
      emissionsTonnes: { type: Number, default: null },
      factorUsed: { type: Number, default: null },
      factorUnit: { type: String, default: '' },
      activityUnit: { type: String, default: '' },
      methodology: { type: String, default: '' },
      source: { type: String, default: '' },
      calculationFormula: { type: String, default: '' },
      isNegativeOffset: { type: Boolean, default: false },
      tier: { type: String, default: '' },
      factorKey: { type: String, default: null },
      factorName: { type: String, default: null },
      recommendation: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index on sha256 scoped to each company.
DocumentSchema.index(
  { companyId: 1, sha256: 1 },
  {
    unique: true,
    partialFilterExpression: { isDuplicate: false, supersededBy: null },
  }
);

export const Document = mongoose.model('Document', DocumentSchema);
