const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
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