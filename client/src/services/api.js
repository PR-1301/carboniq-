const API_BASE = '/api';

let authToken = localStorage.getItem('carboniq_jwt_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('carboniq_jwt_token', token);
  } else {
    localStorage.removeItem('carboniq_jwt_token');
  }
}

export function getAuthToken() {
  return authToken || localStorage.getItem('carboniq_jwt_token');
}

function getAuthHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Health diagnostic check
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

// Authentication endpoints
export async function registerCompany(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function verifyCompanyOtp(data) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (json.success && json.token) {
    setAuthToken(json.token);
  }
  return json;
}

export async function resendCompanyOtp(data) {
  const res = await fetch(`${API_BASE}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginCompany(data) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (json.success && json.token) {
    setAuthToken(json.token);
  }
  return json;
}

export async function getCompanyProfile() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(true),
  });
  return res.json();
}

export async function completeCompanyOnboarding() {
  const res = await fetch(`${API_BASE}/auth/complete-onboarding`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
  });
  return res.json();
}

// Document endpoints
export async function uploadDocumentFiles(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData,
  });
  return res.json();
}

export async function uploadZipArchive(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/documents/upload-zip`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData,
  });
  return res.json();
}

export async function fetchDocuments(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/documents?${query}`, {
    headers: getAuthHeaders(true),
  });
  return res.json();
}

export async function fetchDocumentById(id) {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    headers: getAuthHeaders(true),
  });
  return res.json();
}

export async function reuploadDocumentFile(id, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/documents/${id}/reupload`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData,
  });
  return res.json();
}

export async function reprocessDocumentExtraction(id) {
  const res = await fetch(`${API_BASE}/documents/${id}/reprocess`, {
    method: 'POST',
    headers: getAuthHeaders(true),
  });
  return res.json();
}

export async function submitDocumentReview(id, reviewData) {
  const res = await fetch(`${API_BASE}/documents/${id}/review`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify(reviewData),
  });
  return res.json();
}

// Activity records endpoints
export async function createManualActivity(activityData) {
  const res = await fetch(`${API_BASE}/activities`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    body: JSON.stringify(activityData),
  });
  return res.json();
}

export async function fetchActivities(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/activities?${query}`, {
    headers: getAuthHeaders(true),
  });
  return res.json();
}

export function getPreviewUrl(id) {
  const token = getAuthToken();
  return `${API_BASE}/documents/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

// Emission factor database endpoints
export async function fetchEmissionFactors(params = {}) {
  // Filter out undefined, null, or empty string values from query params
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
      cleanParams[key] = value;
    }
  }
  const query = new URLSearchParams(cleanParams).toString();
  const url = query ? `${API_BASE}/emission-factors?${query}` : `${API_BASE}/emission-factors`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchEmissionFactorSummary() {
  const res = await fetch(`${API_BASE}/emission-factors/summary`);
  return res.json();
}
