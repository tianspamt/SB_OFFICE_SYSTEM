// Turns an uploaded file (image, PDF, or Word) into something
// helpers/documentMeta.js can search for a record's number and date.
// Read-only: nothing here stores anything.
//
//   .docx / .doc  -> plain text (mammoth / word-extractor)
//   PDF           -> the embedded text layer when there is one
//   scanned PDF   -> no text layer, so the pages that matter are rendered to
//                    images (returned as `images`, to be OCR'd)
//   image         -> returned as `images` too
//
// readDocument() returns either { text, method } (nothing more to do) or
// { images, method } (needs OCR — see ocrPages).

const path = require('path')

const PDF_TEXT_PAGE_LIMIT = 40
// OCR is slow (seconds per page), so a scanned PDF only has its first page
// (where the "ORDINANCE NO." heading is) and its last two (where the
// enactment date and signatures are) read.
const PDF_OCR_TAIL_PAGES = 2
const PDF_RENDER_SCALE = 2.5
// A page with fewer characters than this is treated as having no real text
// layer (a stray page number or watermark isn't text).
const MIN_TEXT_CHARS_PER_PAGE = 40

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const DOC_MIME = 'application/msword'

// ─── OCR ─────────────────────────────────────────────────────────────────────
// One shared Tesseract worker instead of a fresh one per call — spinning up a
// worker (and loading the language data) costs more than recognising a page.
// A worker handles one image at a time, so jobs are queued; it's torn down
// after a few idle minutes so it isn't holding memory between uploads.
const OCR_IDLE_MS = 5 * 60 * 1000
let workerPromise = null
let ocrQueue = Promise.resolve()
let ocrPending = 0
let idleTimer = null

const getOcrWorker = () => {
  if (!workerPromise) {
    workerPromise = require('tesseract.js').createWorker('eng').catch((err) => {
      workerPromise = null
      throw err
    })
  }
  return workerPromise
}

async function shutdownOcr() {
  clearTimeout(idleTimer)
  const pending = workerPromise
  workerPromise = null
  if (pending) {
    try { await (await pending).terminate() } catch { /* already gone */ }
  }
}

const scheduleOcrShutdown = () => {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(shutdownOcr, OCR_IDLE_MS)
  idleTimer.unref?.()
}

// Old scans are typically low-resolution, unevenly lit (yellowed paper,
// shadowed edges) and speckled, which makes Tesseract misread characters
// ("0" as "O") or drop lines entirely. No single clean-up wins everywhere —
// benchmarked against synthetic degraded pages:
//   'upscale'  enlarge small images  -> best overall, the default first pass
//   'adaptive' upscale + local-mean threshold -> rescues unevenly lit pages
//              that 'upscale' misreads, but hurts blurry low-res ones
//   'none'     the image as-is        -> cheapest, occasionally the only one
//              that reads a given field
// documentMeta.js therefore runs them in that order and stops as soon as
// both fields are found, merging what each pass finds.
const OCR_MODES = ['upscale', 'adaptive', 'none']
const OCR_TARGET_WIDTH = 1800

async function preprocessForOcr(buffer, mode) {
  if (mode === 'none') return buffer
  try {
    const { createCanvas, loadImage } = require('@napi-rs/canvas')
    const img = await loadImage(buffer)
    const scale = img.width < OCR_TARGET_WIDTH ? Math.min(3, OCR_TARGET_WIDTH / img.width) : 1
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)
    if (mode === 'upscale') return canvas.toBuffer('image/png')

    // 'adaptive': grayscale, then ink = darker than 85% of the local mean
    // (integral image -> window mean in O(pixels)), so a shadowed corner
    // doesn't get thresholded away like a single global cutoff would.
    const imageData = ctx.getImageData(0, 0, w, h)
    const px = imageData.data
    const gray = new Uint8Array(w * h)
    for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
      gray[i] = (px[p] * 299 + px[p + 1] * 587 + px[p + 2] * 114) / 1000
    }
    const integral = new Float64Array((w + 1) * (h + 1))
    for (let y = 1; y <= h; y++) {
      let rowSum = 0
      for (let x = 1; x <= w; x++) {
        rowSum += gray[(y - 1) * w + (x - 1)]
        integral[y * (w + 1) + x] = integral[(y - 1) * (w + 1) + x] + rowSum
      }
    }
    const half = Math.max(8, Math.floor(w / 32))
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - half)
      const y1 = Math.min(h - 1, y + half)
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - half)
        const x1 = Math.min(w - 1, x + half)
        const count = (x1 - x0 + 1) * (y1 - y0 + 1)
        const sum =
          integral[(y1 + 1) * (w + 1) + (x1 + 1)] -
          integral[y0 * (w + 1) + (x1 + 1)] -
          integral[(y1 + 1) * (w + 1) + x0] +
          integral[y0 * (w + 1) + x0]
        const v = gray[y * w + x] * count < sum * 0.85 ? 0 : 255
        const p = (y * w + x) * 4
        px[p] = px[p + 1] = px[p + 2] = v
        px[p + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
    return canvas.toBuffer('image/png')
  } catch (err) {
    console.error('OCR preprocess skipped:', err.message)
    return buffer
  }
}

// A very noisy page can keep Tesseract busy for minutes while finding
// nothing readable. Past this it's abandoned (the worker is torn down and
// rebuilt for the next page) and the page just contributes no text.
const OCR_PAGE_TIMEOUT_MS = 25 * 1000

const ocrImage = (buffer, mode, timeoutMs = OCR_PAGE_TIMEOUT_MS) => {
  ocrPending++
  const job = ocrQueue.then(async () => {
    const worker = await getOcrWorker()
    const prepared = await preprocessForOcr(buffer, mode)
    let timer
    const timedOut = new Promise((resolve) => {
      timer = setTimeout(async () => {
        await shutdownOcr()
        resolve('')
      }, timeoutMs)
    })
    try {
      const recognized = worker.recognize(prepared).then(({ data }) => data.text || '').catch(() => '')
      return await Promise.race([recognized, timedOut])
    } finally {
      clearTimeout(timer)
      scheduleOcrShutdown()
    }
  })
  ocrQueue = job.catch(() => {})
  return job.finally(() => { ocrPending-- })
}

// OCRs several page images in order and joins them into one text. Once
// `deadline` (epoch ms) is near, remaining pages are skipped and each page's
// own timeout is trimmed to fit.
async function ocrPages(images, mode = OCR_MODES[0], { deadline } = {}) {
  const texts = []
  for (const image of images) {
    let timeoutMs = OCR_PAGE_TIMEOUT_MS
    if (deadline) {
      const remaining = deadline - Date.now()
      if (remaining < 3000) break
      timeoutMs = Math.min(timeoutMs, remaining)
    }
    texts.push(await ocrImage(image, mode, timeoutMs))
  }
  return texts.join('\n\n')
}

// How many OCR page jobs are queued or running — lets a caller refuse new
// work instead of stacking up minutes of backlog behind one worker.
const ocrBacklog = () => ocrPending

// ─── PDF ─────────────────────────────────────────────────────────────────────

let pdfjsPromise = null
const loadPdfjs = () => {
  if (!pdfjsPromise) pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs')
  return pdfjsPromise
}

const pdfjsAssetUrl = (dir) => {
  const root = path.dirname(require.resolve('pdfjs-dist/package.json'))
  return `${path.join(root, dir).replace(/\\/g, '/')}/`
}

const pageText = async (page) => {
  const content = await page.getTextContent()
  let out = ''
  for (const item of content.items) {
    if (typeof item.str !== 'string') continue
    out += item.str
    out += item.hasEOL ? '\n' : ' '
  }
  return out.trim()
}

const renderPageToPng = async (pdf, page) => {
  const viewport = page.getViewport({ scale: PDF_RENDER_SCALE })
  const { canvas, context } = pdf.canvasFactory.create(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height)
  )
  await page.render({ canvasContext: context, viewport, canvas }).promise
  const png = canvas.toBuffer('image/png')
  page.cleanup()
  return png
}

async function readPdf(buffer) {
  const pdfjs = await loadPdfjs()
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: pdfjsAssetUrl('standard_fonts'),
    cMapUrl: pdfjsAssetUrl('cmaps'),
    cMapPacked: true,
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: 0,
  }).promise

  try {
    const total = pdf.numPages
    const texts = []
    for (let i = 1; i <= Math.min(total, PDF_TEXT_PAGE_LIMIT); i++) {
      texts.push(await pageText(await pdf.getPage(i)))
    }
    const combined = texts.join('\n\n')
    if (combined.replace(/\s/g, '').length >= MIN_TEXT_CHARS_PER_PAGE * Math.min(total, 2)) {
      return { text: combined, method: 'pdf-text' }
    }

    // No usable text layer — a scan. Render the pages worth reading.
    const wanted = new Set([1])
    for (let i = Math.max(2, total - PDF_OCR_TAIL_PAGES + 1); i <= total; i++) wanted.add(i)
    const images = []
    for (const n of [...wanted].sort((a, b) => a - b)) {
      images.push(await renderPageToPng(pdf, await pdf.getPage(n)))
    }
    return { images, method: 'pdf-ocr' }
  } finally {
    await pdf.destroy()
  }
}

// ─── Word ────────────────────────────────────────────────────────────────────

async function readDocx(buffer) {
  const mammoth = require('mammoth')
  const { value } = await mammoth.extractRawText({ buffer })
  return { text: value || '', method: 'docx' }
}

async function readDoc(buffer) {
  const WordExtractor = require('word-extractor')
  const doc = await new WordExtractor().extract(buffer)
  return { text: doc.getBody() || '', method: 'doc' }
}

// ─── Public entry ────────────────────────────────────────────────────────────

// `file` is a multer memory-storage file ({ buffer, mimetype }).
async function readDocument(file) {
  const mime = file.mimetype
  if (mime.startsWith('image/')) return { images: [file.buffer], method: 'ocr' }
  if (mime === 'application/pdf') return readPdf(file.buffer)
  if (mime === DOCX_MIME) return readDocx(file.buffer)
  if (mime === DOC_MIME) return readDoc(file.buffer)
  return { text: '', method: 'unsupported' }
}

module.exports = { readDocument, ocrPages, ocrBacklog, shutdownOcr, OCR_MODES }
