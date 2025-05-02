/**
 * Trigger a download of text content in the browser.
 */
export function download(data: string, filename: string, mimeType = "text/plain") {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}