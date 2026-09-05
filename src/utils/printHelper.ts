/**
 * Helper utility for triggering document printing reliably across browsers,
 * iframe sandboxes (such as AI Studio preview), and mobile devices.
 */

export function executePrint(title?: string): void {
  // Save original page title if provided
  const originalTitle = document.title;
  if (title) {
    document.title = title;
  }

  try {
    window.focus();
    window.print();
  } catch (err) {
    console.warn('Direct window.print encountered an error, trying fallback:', err);
    try {
      // Create a print iframe fallback if parent blocked window.print
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title || 'Cetak Dokumen BOP RT'}</title>
              <style>
                ${Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                  .map((el) => el.outerHTML)
                  .join('\n')}
              </style>
            </head>
            <body>
              ${document.querySelector('.document-sheet, .print-document, main')?.innerHTML || document.body.innerHTML}
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(printIframe);
          }, 2000);
        }, 500);
      }
    } catch (fallbackErr) {
      console.error('Print iframe fallback error:', fallbackErr);
    }
  } finally {
    if (title) {
      setTimeout(() => {
        document.title = originalTitle;
      }, 2000);
    }
  }
}

/**
 * Checks if current execution environment is inside an iframe
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Open current preview in a clean new browser tab for 100% native printing
 */
export function openInNewTab(): void {
  try {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('Failed to open in new tab:', err);
  }
}
