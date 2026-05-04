const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)

const getIP = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress

const safeParseJSON = (str, fallback = []) => {
  try { return JSON.parse(str) }
  catch { return fallback }
}

module.exports = { isValidEmail, getIP, safeParseJSON }
