import { useRef, useState } from 'react'
import { parseChaseStatement, linesFromItems } from './statement'

const apiBase = (import.meta.env.VITE_API_BASE_URL || '/server/personal_finance_tracker_function').replace(/\/$/, '')
export default function StatementImport({ onImported, onClose }) {
  const [rows, setRows] = useState([]), [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(''), [purchaseTotal, setPurchaseTotal] = useState(0)
  const lock = useRef(false)
  async function readPdf(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setRows([]); setMessage(''); setBusy(true)
    let document, loadingTask
    try {
      if (file.size > 15 * 1024 * 1024) throw new Error('Choose a PDF smaller than 15 MB.')
      const pdfjs = await import('pdfjs-dist')
      const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
      document = await loadingTask.promise
      if (document.numPages > 50) throw new Error('Choose a statement with 50 pages or fewer.')
      const pages = []
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber)
        pages.push(linesFromItems((await page.getTextContent()).items))
      }
      const parsed = parseChaseStatement(pages.join('\n'))
      setRows(parsed.rows); setPurchaseTotal(parsed.purchaseTotal)
    } catch (error) { setMessage(error.message || 'Unable to read PDF. Remove password protection and try again.') }
    finally { await loadingTask?.destroy(); setBusy(false) }
  }
  async function save() {
    if (lock.current) return
    lock.current = true; setBusy(true); setMessage('')
    try {
      const response = await fetch(`${apiBase}/transactions/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Import failed. Retry to skip already saved rows.')
      setMessage(`Imported ${result.inserted} transactions; skipped ${result.skipped} already saved transactions.`)
      setRows([]); await onImported()
    } catch (error) { setMessage(error.message) }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="panel statementImport" aria-label="Statement import">
    <div className="panelTitle"><div><h3>Import Chase PDF statement</h3><p>Review transactions and categories before saving. Card payments are transfers.</p></div><button className="textButton" disabled={busy} onClick={onClose}>Close</button></div>
    <p>The PDF is read in your browser. Only the transactions you approve are sent to your finance API. Readable Chase credit-card PDFs are supported; scanned statements need OCR.</p>
    <label>Choose statement PDF <input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={readPdf} /></label>
    {busy && <p role="status">Processing statement…</p>}
    {message && <p role="status">{message}</p>}
    {rows.length > 0 && <><p>{rows.length} transactions · purchases ${purchaseTotal.toFixed(2)} · matched statement summary</p>
      <div className="statementTable"><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Category</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td>{row.TRANSACTION_DATE}</td><td>{row.DESCRIPTION}</td><td>{row.TRANSACTION_TYPE === 'Credit' ? '-' : ''}${row.AMOUNT.toFixed(2)}</td><td><input aria-label={`Category for ${row.DESCRIPTION}`} disabled={busy} value={row.CATEGORY} onChange={event => setRows(current => current.map((item, i) => i === index ? { ...item, CATEGORY: event.target.value } : item))} /></td></tr>)}</tbody></table></div>
      <button className="primaryButton" disabled={busy || rows.some(row => !row.CATEGORY.trim())} onClick={save}>Import reviewed transactions</button></>}
  </section>
}
