/**
 * Helper to extract Google Drive file ID and build embeddable player URLs
 */

export function extractDriveFileId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already just an alphanumeric id
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  // /file/d/FILE_ID
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // ?id=FILE_ID
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
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

export function isValidDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || extractDriveFileId(url) !== null;
}
