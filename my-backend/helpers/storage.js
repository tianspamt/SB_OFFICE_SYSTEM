const path = require('path')
const supabase = require('../config/supabase')

const uploadToStorage = async (file, folder) => {
  if (!file) throw new Error('No file provided for upload.')
  const ext = path.extname(file.originalname)
  // Random suffix guards against filename collisions when several files are
  // uploaded in the same request (e.g. a multi-image post) — Date.now() alone
  // has millisecond resolution and a tight loop can produce duplicates.
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const fileName = `${folder}/${unique}${ext}`
  const { error: uploadError } = await supabase.storage
    .from('assets')
    // Each upload gets a unique filename (see `unique` above) and is never
    // overwritten, so a 1-year cache is risk-free — this URL will never
    // point at different content later, unlike Supabase's 1h default.
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
      cacheControl: '31536000',
    })
  if (uploadError) throw new Error(uploadError.message)
  const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName)
  return { fileName, publicUrl }
}

const deleteFromStorage = async (filePath) => {
  if (!filePath) return
  const { error } = await supabase.storage.from('assets').remove([filePath])
  if (error) console.error('Storage delete error:', error.message)
}

module.exports = { uploadToStorage, deleteFromStorage }
