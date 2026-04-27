import { existsSync } from 'node:fs';

import puppeteer, { type Browser, type Page, type PaperFormat } from 'puppeteer-core';

const BROWSER_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter((path): path is string => Boolean(path));

const resolveExecutablePath = (): string | undefined => {
  return BROWSER_PATHS.find((path) => existsSync(path));
};

export class PdfGestion {
  /**
   * Genera un PDF a partir de una URL interna (donde se renderizan los gráficos Recharts).
   * En producción, esta URL apuntaría a un servidor de renderizado interno (ej. http://localhost:3000/internal/reporte-ventas)
   */
  static async generarPdfDesdeHtml(url: string, options: { format?: PaperFormat } = {}): Promise<Buffer> {
    let browser: Browser | null = null;

    try {
      const executablePath = resolveExecutablePath();

      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Requerido en entornos Docker/Linux
      });

      const page: Page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Espera breve para dar tiempo al renderizado, pero no bloquea el PDF si Recharts no aparece.
      try {
        await page.waitForSelector('.recharts-wrapper, .recharts-surface, main, body', { timeout: 8000 });
      } catch {
        // El reporte debe generarse aunque el dashboard interno no pinte el gráfico a tiempo.
      }

      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 5000 }).catch(() => undefined);

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generando PDF con Puppeteer:', error);
      throw new Error(
        'No se pudo generar el reporte de gestión. Verifica que Chrome/Edge esté instalado o define PUPPETEER_EXECUTABLE_PATH.'
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}