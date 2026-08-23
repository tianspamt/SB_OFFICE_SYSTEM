const multer = require('multer')

// 20MB per file — comfortably covers scanned PDFs/Word docs and OCR source
// images while still capping the worst case (images[]=10 accepts up to 10
// files, so an unbounded per-file size could add up to a very large request).
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const allowed = [
  'image/jpeg', 'image/png', 'image/jpg',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
    if (allowed.includes(file.mimetype)) cb(null, true)
   else cb(new Error('Only images, PDFs, and Word documents are allowed'))
  }
})

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message })
  }
  if (err) return res.status(400).json({ error: err.message })
  next()
}

module.exports = { upload, handleMulterError }