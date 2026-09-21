const PDFParser = require('pdf2json')

// pdf2json stores each piece of text URI-encoded, and a PDF with an odd or
// broken character in it makes decodeURIComponent throw "URI malformed".
// That throw happens inside pdf2json's own event callback, where no try/catch
// of ours can see it — it escapes as an uncaught exception and takes the whole
// server down. So the decoding is guarded here, and the entire parse can only
// ever produce text or null; it never throws.
const safeDecode = (value) => {
  try { return decodeURIComponent(value) } catch { return value }
}

// The text layer of a PDF (a Buffer), or null when there is none / it can't be
// read. A scanned PDF has no text layer, so callers needing scans go through
// the OCR path in helpers/documentText.js instead.
const pdfBufferText = (buffer) =>
  new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    try {
      const parser = new PDFParser()
      parser.on('pdfParser_dataReady', (data) => {
        try {
          const text = (data.Pages || [])
            .flatMap((page) => page.Texts || [])
            .map((t) => (t.R || []).map((run) => safeDecode(run.T || '')).join(''))
            .join(' ')
            .trim()
          finish(text || null)
        } catch (err) {
          console.error('PDF text error:', err.message)
          finish(null)
        }
      })
      parser.on('pdfParser_dataError', () => finish(null))
      parser.parseBuffer(buffer)
    } catch (err) {
      console.error('PDF parse error:', err.message)
      finish(null)
    }
  })

module.exports = { pdfBufferText }
