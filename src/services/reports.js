// SlopeGuard AI - Persistent Reports Management Service
// Direct synchronization between Node Express SQLite Database (/api/reports)
// and browser LocalStorage ('slopeguard_reports_db')

const LOCAL_STORAGE_KEY = 'slopeguard_reports_db';

// Helper: Get local reports from localStorage
export function getLocalReports() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local reports:', e);
    return [];
  }
}

// Helper: Save local reports array to localStorage
export function saveLocalReports(reports) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving local reports:', e);
  }
}

// Fetch all reports from Server API, fallback to / merge with localStorage
export async function fetchAllReports() {
  const localList = getLocalReports();
  try {
    const res = await fetch('/api/reports');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serverList = json.data;
          
          // Merge server reports with local storage reports (server takes precedence)
          const serverIds = new Set(serverList.map(r => r.reportId));
          const missingLocal = localList.filter(r => r.reportId && !serverIds.has(r.reportId));
          const merged = [...serverList, ...missingLocal];

          saveLocalReports(merged);
          return merged;
        }
      }
    }
  } catch (err) {
    console.warn('Backend /api/reports unavailable, using local storage reports:', err);
  }
  return localList;
}

// Save a new report to Server API AND localStorage
export async function submitReport(reportData, imageFile) {
  let createdReport = null;

  try {
    const formData = new FormData();
    formData.append('userId', reportData.userId || '');
    formData.append('areaId', reportData.areaId || '');
    formData.append('reportType', reportData.reportType || '');
    formData.append('description', reportData.description || '');
    formData.append('reporterName', reportData.reporterName || '');
    formData.append('reporterPhone', reportData.reporterPhone || '');
    formData.append('reporterEmail', reportData.reporterEmail || '');
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const res = await fetch('/api/reports', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && json.data) {
          createdReport = json.data;
        }
      }
    }
  } catch (err) {
    console.warn('POST /api/reports server error, storing locally:', err);
  }

  if (!createdReport) {
    createdReport = reportData;
  }

  // Save to localStorage immediately
  const existing = getLocalReports();
  const filtered = existing.filter(r => r.reportId !== createdReport.reportId);
  const updatedList = [createdReport, ...filtered];
  saveLocalReports(updatedList);

  return { report: createdReport, allReports: updatedList };
}

// Update report status (Approve, Push Alert, Dismiss)
export async function updateReportStatus(reportId, status, note = '') {
  try {
    await fetch(`/api/reports/${reportId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    });
  } catch (err) {
    console.warn(`PUT /api/reports/${reportId} failed, updating locally:`, err);
  }

  // Update in localStorage as well
  const existing = getLocalReports();
  const updatedList = existing.map(r => r.reportId === reportId ? { ...r, status, note } : r);
  saveLocalReports(updatedList);
  return updatedList;
}
