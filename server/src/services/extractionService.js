import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { parse as parseCsvSync } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { performGroqVisionExtraction } from './groqService.js';

/**
 * Extracts raw textual content from supported file types
 */
export async function extractRawContent(filePath, mimeType, originalFileName) {
  const ext = path.extname(originalFileName).toLowerCase();

  // 1. PDF Documents
  if (ext === '.pdf' || mimeType === 'application/pdf') {
    try {
      const buffer = fs.readFileSync(filePath);
      const uint8 = new Uint8Array(buffer);
      const parser = new PDFParse(uint8);
      const result = await parser.getText();
      const text = (result.text || '').trim();

      // If digital text was found
      if (text.length >= 30) {
        return {
          method: 'PDF_TEXT',
          text,
          pages: result.pages || [],
          pageCount: result.total || 1,
          confidence: 0.95,
          error: null,
        };
      }

      // If digital text is empty/sparse, it's likely a scanned PDF image
      const groqResult = await performGroqVisionExtraction(filePath, originalFileName, mimeType);
      return {
        method: 'GROQ_VISION',
        text: groqResult.text,
        confidence: groqResult.confidence,
        error: groqResult.error,
        scope: groqResult.scope,
        groqAnalysis: groqResult.success ? groqResult : null,
        pageCount: 1,
      };
    } catch (err) {
      // Fallback to Groq Vision if PDFParse fails
      const groqResult = await performGroqVisionExtraction(filePath, originalFileName, mimeType);
      return {
        method: 'GROQ_VISION',
        text: groqResult.text,
        confidence: groqResult.confidence,
        error: groqResult.error || err.message,
        scope: groqResult.scope,
        groqAnalysis: groqResult.success ? groqResult : null,
        pageCount: 1,
      };
    }
  }

  // 2. Images (JPEG, PNG, JPG) - Processed with Groq Vision
  if (['.jpg', '.jpeg', '.png'].includes(ext) || mimeType.startsWith('image/')) {
    const groqResult = await performGroqVisionExtraction(filePath, originalFileName, mimeType);
    return {
      method: 'GROQ_VISION',
      text: groqResult.text,
      confidence: groqResult.confidence,
      error: groqResult.error,
      scope: groqResult.scope,
      groqAnalysis: groqResult.success ? groqResult : null,
      pageCount: 1,
    };
  }

  // 3. CSV Tabular Documents
  if (ext === '.csv' || mimeType === 'text/csv') {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const records = parseCsvSync(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const text = records
        .map((row, i) => `Row ${i + 1}: ${Object.entries(row).map(([k, v]) => `${k}=${v}`).join(', ')}`)
        .join('\n');

      return {
        method: 'CSV_PARSER',
        text,
        rawRecords: records,
        confidence: 0.98,
        error: null,
        pageCount: 1,
      };
    } catch (err) {
      return {
        method: 'CSV_PARSER',
        text: '',
        confidence: 0,
        error: `Failed to parse CSV: ${err.message}`,
        pageCount: 0,
      };
    }
  }

  // 4. Excel Documents (XLSX, XLS)
  if (['.xlsx', '.xls'].includes(ext) || mimeType.includes('spreadsheetml')) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const records = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const text = records
        .map((row, i) => `Row ${i + 1}: ${Object.entries(row).map(([k, v]) => `${k}=${v}`).join(', ')}`)
        .join('\n');

      return {
        method: 'EXCEL_PARSER',
        text,
        rawRecords: records,
        confidence: 0.98,
        error: null,
        pageCount: 1,
      };
    } catch (err) {
      return {
        method: 'EXCEL_PARSER',
        text: '',
        confidence: 0,
        error: `Failed to parse Excel workbook: ${err.message}`,
        pageCount: 0,
      };
    }
  }

  return {
    method: 'NONE',
    text: '',
    confidence: 0,
    error: `Unsupported file format: ${ext}`,
    pageCount: 0,
  };
}

/**
 * Parses structured candidate fields from extracted text or table records
 */
export function extractStructuredFields(text = '', documentType = 'UNKNOWN', fileName = '', rawRecords = null) {
  // If tabular records are provided, check first row or dominant fields
  if (rawRecords && Array.isArray(rawRecords) && rawRecords.length > 0) {
    const first = rawRecords[0];
    const findCol = (keys) => {
      const foundKey = Object.keys(first).find((k) =>
        keys.some((cand) => k.toLowerCase().includes(cand.toLowerCase()))
      );
      return foundKey ? first[foundKey] : null;
    };

    const dateVal = findCol(['date', 'time', 'period']);
    const qtyVal = parseFloat(findCol(['quantity', 'qty', 'amount', 'consumption', 'usage', 'litres', 'kwh', 'distance']));
    const unitVal = findCol(['unit', 'uom']) || (findCol(['kwh']) ? 'kWh' : findCol(['liter']) ? 'Liters' : '');
    const supplierVal = findCol(['supplier', 'vendor', 'provider', 'contractor']);
    const descVal = findCol(['description', 'item', 'details', 'particulars', 'activity']);

    const category = inferCategoryFromDocType(documentType, text);

    return {
      category,
      activityDate: parseDate(dateVal),
      quantity: isNaN(qtyVal) ? null : qtyVal,
      unit: unitVal || '',
      supplierName: supplierVal ? String(supplierVal).trim() : '',
      description: descVal ? String(descVal).trim() : `Extracted from spreadsheet (${rawRecords.length} records)`,
      categoryData: {
        fuelType: findCol(['fuel', 'fuel_type']) || '',
        transportMode: findCol(['mode', 'transport', 'vehicle']) || '',
        wasteType: findCol(['waste', 'waste_type']) || '',
        disposalMethod: findCol(['disposal', 'method']) || '',
      },
    };
  }

  // Regex and pattern extraction from raw text
  const category = inferCategoryFromDocType(documentType, text);
  const parsedDate = extractDateFromText(text);
  const parsedSupplier = extractSupplierFromText(text);
  const parsedQuantityAndUnit = extractQuantityAndUnit(text, category);

  return {
    category,
    activityDate: parsedDate,
    quantity: parsedQuantityAndUnit.quantity,
    unit: parsedQuantityAndUnit.unit,
    supplierName: parsedSupplier,
    description: parsedQuantityAndUnit.description || `Extracted from ${fileName}`,
    categoryData: {
      fuelType: extractFuelType(text, category),
      transportMode: extractTransportMode(text, category),
      wasteType: extractWasteType(text, category),
      disposalMethod: extractDisposalMethod(text, category),
    },
  };
}

/**
 * Validates fields according to SME operational category requirements
 */
export function validateExtractedFields(fields, category) {
  const errors = [];
  const confidence = {
    category: fields.category ? 0.9 : 0.2,
    activityDate: fields.activityDate ? 0.85 : 0.0,
    quantity: fields.quantity != null && fields.quantity > 0 ? 0.9 : 0.0,
    unit: fields.unit ? 0.9 : 0.0,
    supplierName: fields.supplierName ? 0.8 : 0.3,
  };

  if (!fields.activityDate) {
    errors.push('Missing valid activity date or billing period.');
  }

  if (fields.quantity == null || isNaN(fields.quantity) || fields.quantity <= 0) {
    errors.push('Missing or invalid numeric activity quantity.');
  }

  if (!fields.unit || fields.unit.trim() === '') {
    errors.push('Missing measurement unit.');
  }

  switch (category) {
    case 'ELECTRICITY': {
      const validUnits = ['kwh', 'mwh', 'units', 'wh'];
      if (fields.unit && !validUnits.includes(fields.unit.toLowerCase())) {
        errors.push(`Unrecognized unit '${fields.unit}' for electricity (expected: kWh, MWh).`);
      }
      break;
    }
    case 'FUEL': {
      const validFuelUnits = ['liters', 'litres', 'l', 'gallons', 'gal', 'm3', 'kg', 'barrels'];
      if (fields.unit && !validFuelUnits.includes(fields.unit.toLowerCase())) {
        errors.push(`Unrecognized unit '${fields.unit}' for fuel (expected: Liters, Gallons, m3).`);
      }
      if (!fields.categoryData?.fuelType) {
        errors.push('Missing fuel type (e.g., Diesel, Petrol, Natural Gas).');
      }
      break;
    }
    case 'TRANSPORTATION': {
      const validTransportUnits = ['km', 'miles', 'mi', 'tonne-km', 'tkm', 'ton-miles'];
      if (fields.unit && !validTransportUnits.includes(fields.unit.toLowerCase())) {
        errors.push(`Unrecognized unit '${fields.unit}' for transportation (expected: km, miles, tonne-km).`);
      }
      if (!fields.categoryData?.transportMode) {
        errors.push('Missing transportation mode (e.g., Road / Truck, Air, Sea Freight, Rail).');
      }
      break;
    }
    case 'WASTE': {
      const validWasteUnits = ['kg', 'tonnes', 'tons', 'lbs', 'm3'];
      if (fields.unit && !validWasteUnits.includes(fields.unit.toLowerCase())) {
        errors.push(`Unrecognized unit '${fields.unit}' for waste (expected: kg, tonnes, tons).`);
      }
      if (!fields.categoryData?.wasteType) {
        errors.push('Missing waste type (e.g., General, Recyclable, Hazardous, Scrap Metal).');
      }
      break;
    }
    case 'SUPPLIER_INVOICE': {
      if (!fields.supplierName || fields.supplierName.trim() === '') {
        errors.push('Missing supplier / vendor name.');
      }
      break;
    }
    default:
      break;
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    validationErrors: errors,
    fieldConfidence: confidence,
  };
}

// ----------------- Helpers -----------------

function inferCategoryFromDocType(documentType, text = '') {
  switch (documentType) {
    case 'ELECTRICITY_BILL':
      return 'ELECTRICITY';
    case 'FUEL_RECEIPT':
      return 'FUEL';
    case 'TRANSPORT_RECORD':
      return 'TRANSPORTATION';
    case 'WASTE_RECORD':
      return 'WASTE';
    case 'SUPPLIER_INVOICE':
      return 'SUPPLIER_INVOICE';
    default: {
      const lower = text.toLowerCase();
      if (lower.includes('kwh') || lower.includes('electric')) return 'ELECTRICITY';
      if (lower.includes('diesel') || lower.includes('petrol') || lower.includes('fuel')) return 'FUEL';
      if (lower.includes('freight') || lower.includes('transport') || lower.includes('shipment')) return 'TRANSPORTATION';
      if (lower.includes('waste') || lower.includes('recycling')) return 'WASTE';
      return 'SUPPLIER_INVOICE';
    }
  }
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function extractDateFromText(text) {
  // ISO: 2024-05-23
  const isoMatch = text.match(/\b(20\d\d[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01]))\b/);
  if (isoMatch) return new Date(isoMatch[1]);

  // DD/MM/YYYY or MM/DD/YYYY: 14/05/2024
  const slashMatch = text.match(/\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](20\d\d)\b/);
  if (slashMatch) {
    const d = new Date(`${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Named month: 14 May 2024 or May 14, 2024
  const monthMatch = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(20\d\d)\b/i);
  if (monthMatch) {
    const d = new Date(`${monthMatch[1]} ${monthMatch[2]}, ${monthMatch[3]}`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function extractSupplierFromText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    const match = line.match(/(?:supplier|vendor|biller|from|company|contractor)\s*:\s*([^,\n\r]+)/i);
    if (match) return match[1].trim();
  }
  // If top line looks like a company name
  if (lines.length > 0 && lines[0].length < 50 && !/invoice|bill|receipt|statement|date/i.test(lines[0])) {
    return lines[0];
  }
  return '';
}

function extractQuantityAndUnit(text, category) {
  const result = { quantity: null, unit: '', description: '' };

  if (category === 'ELECTRICITY') {
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(kwh|mwh|units)/i);
    if (match) {
      result.quantity = parseFloat(match[1].replace(',', ''));
      result.unit = match[2].toUpperCase() === 'MWH' ? 'MWh' : 'kWh';
      return result;
    }
    const elecMatch = text.match(/(?:consumption|usage|electricity|power|total)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
    if (elecMatch) {
      result.quantity = parseFloat(elecMatch[1].replace(',', ''));
      result.unit = 'kWh';
      return result;
    }
  }

  if (category === 'FUEL') {
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(liters|litres|l\b|gallons|gal|m3)/i);
    if (match) {
      result.quantity = parseFloat(match[1].replace(',', ''));
      result.unit = match[2].toLowerCase().startsWith('l') ? 'Liters' : match[2];
      return result;
    }
  }

  if (category === 'TRANSPORTATION') {
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(km|miles|mi|tonne-km|tkm)/i);
    if (match) {
      result.quantity = parseFloat(match[1].replace(',', ''));
      result.unit = match[2].toLowerCase().includes('t') ? 'tonne-km' : match[2].toLowerCase();
      return result;
    }
  }

  if (category === 'WASTE') {
    const match = text.match(/(\d+(?:[.,]\d+)?)\s*(kg|tonnes|tons|lbs)/i);
    if (match) {
      result.quantity = parseFloat(match[1].replace(',', ''));
      result.unit = match[2].toLowerCase();
      return result;
    }
  }

  // Fallback for general quantity / total
  const genericMatch = text.match(/(?:total|amount|qty|quantity)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Z%]+)?/i);
  if (genericMatch) {
    result.quantity = parseFloat(genericMatch[1].replace(',', ''));
    result.unit = genericMatch[2] || 'units';
  }

  return result;
}

function extractFuelType(text, category) {
  if (category !== 'FUEL') return '';
  const lower = text.toLowerCase();
  if (lower.includes('diesel')) return 'Diesel';
  if (lower.includes('petrol') || lower.includes('gasoline')) return 'Petrol / Gasoline';
  if (lower.includes('natural gas') || lower.includes('cng')) return 'Natural Gas (CNG)';
  if (lower.includes('lpg') || lower.includes('propane')) return 'LPG';
  return '';
}

function extractTransportMode(text, category) {
  if (category !== 'TRANSPORTATION') return '';
  const lower = text.toLowerCase();
  if (lower.includes('air') || lower.includes('flight')) return 'Air Freight';
  if (lower.includes('sea') || lower.includes('maritime') || lower.includes('ocean')) return 'Sea Freight';
  if (lower.includes('rail') || lower.includes('train')) return 'Rail';
  if (lower.includes('truck') || lower.includes('road') || lower.includes('van')) return 'Road / Truck';
  return 'Road / Truck';
}

function extractWasteType(text, category) {
  if (category !== 'WASTE') return '';
  const lower = text.toLowerCase();
  if (lower.includes('hazardous')) return 'Hazardous Waste';
  if (lower.includes('scrap metal') || lower.includes('metal')) return 'Scrap Metal';
  if (lower.includes('plastic')) return 'Plastic';
  if (lower.includes('paper') || lower.includes('cardboard')) return 'Paper / Cardboard';
  if (lower.includes('organic') || lower.includes('compost')) return 'Organic Waste';
  return 'General Municipal Waste';
}

function extractDisposalMethod(text, category) {
  if (category !== 'WASTE') return '';
  const lower = text.toLowerCase();
  if (lower.includes('recycled') || lower.includes('recycling')) return 'Recycled';
  if (lower.includes('landfill')) return 'Landfill';
  if (lower.includes('incineration') || lower.includes('burned')) return 'Incineration';
  if (lower.includes('composted') || lower.includes('compost')) return 'Composted';
  return 'Landfill';
}
