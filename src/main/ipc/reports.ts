import { BrowserWindow, dialog, ipcMain } from 'electron'
import { sessionRepository } from '../repositories/session.repository'
import { isActive } from '../auth/session'
import type { TrendQuery } from '@shared/report'

/**
 * Report channels. See Application Design Document section 6.11.
 */

function requireSession(): void {
  if (!isActive()) throw new Error('Your session has ended. Please sign in again.')
}

export function registerReportHandlers(): void {
  ipcMain.handle('reports:trends', (_event, query: TrendQuery) => {
    requireSession()
    return sessionRepository.findForReport(
      query.patientId,
      query.programId,
      query.dateFrom,
      query.dateTo
    )
  })

  /**
   * Renders the report to PDF.
   *
   * The renderer sends the report markup, which is loaded into an offscreen
   * window and printed. The graphs are inline SVG, so they survive this
   * without needing to be redrawn — the PDF shows exactly what was on
   * screen rather than a reconstruction of it.
   */
  ipcMain.handle('reports:exportPdf', async (_event, html: string, suggestedName: string) => {
    requireSession()

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Export report',
      defaultPath: suggestedName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (canceled || !filePath) return { ok: false as const }

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true, javascript: false }
    })

    try {
      await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
      )

      const pdf = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
      })

      const { writeFile } = await import('node:fs/promises')
      await writeFile(filePath, pdf)

      return { ok: true as const, filePath }
    } finally {
      printWindow.destroy()
    }
  })
}
