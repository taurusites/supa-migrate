// utils/download.ts
/**
 * Trigger a browser download of arbitrary text.
 * @param data The text content to download
 * @param filename The name of the file to download
 * @param mimeType The mime type, e.g. "text/sql"
 */
export function download(data: string, filename: string, mimeType: string) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }