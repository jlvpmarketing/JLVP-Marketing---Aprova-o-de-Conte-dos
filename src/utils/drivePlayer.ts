/**
 * Helper to extract Google Drive file ID and build embeddable player URLs
 */

export function extractDriveFileId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already just an alphanumeric id (standard Google Drive IDs are 25-44 chars)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }

  // /file/d/FILE_ID or /file/u/X/d/FILE_ID
  const matchFileD = trimmed.match(/\/file\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // /d/FILE_ID
  const matchSimpleD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchSimpleD && matchSimpleD[1]) {
    return matchSimpleD[1];
  }

  // ?id=FILE_ID or &id=FILE_ID or open?id=FILE_ID or uc?id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }

  // Folders: /folders/FOLDER_ID or /folders/u/X/FOLDER_ID
  const matchFolder = trimmed.match(/\/folders\/(?:u\/\d+\/)?([a-zA-Z0-9_-]+)/);
  if (matchFolder && matchFolder[1]) {
    return matchFolder[1];
  }

  // Generic fallback: find any 25+ char token consisting of base64url characters
  const genericMatch = trimmed.match(/([a-zA-Z0-9_-]{25,})/);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1];
  }

  return null;
}

export function getDriveEmbedUrl(urlOrId: string): string {
  const fileId = extractDriveFileId(urlOrId);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return urlOrId;
}

export function getDriveDirectViewUrl(urlOrId: string): string {
  const fileId = extractDriveFileId(urlOrId);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  return urlOrId;
}

export function isValidDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || extractDriveFileId(url) !== null;
}

