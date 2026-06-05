/** Extract folder ID from common Google Drive folder URL shapes. */
export function parseDriveFolderId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/(?:open\?id=|folderview\?id=)([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function isDriveFolderUrl(url: string): boolean {
  return parseDriveFolderId(url) !== null;
}
