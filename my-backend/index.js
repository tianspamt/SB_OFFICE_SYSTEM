require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const helmet = require('helmet')

const { globalLimiter } = require('./middleware/rateLimiter')

// ---- ROUTES ----
const authRoutes          = require('./routes/auth')
const userRoutes          = require('./routes/users')
const activityLogRoutes   = require('./routes/activityLogs')
const councilMemberRoutes = require('./routes/councilMembers')
const councilRoutes        = require('./routes/councils')
const ordinanceRoutes     = require('./routes/ordinances')
const resolutionRoutes    = require('./routes/resolutions')
const sessionMinuteRoutes = require('./routes/sessionMinutes')
const announcementRoutes  = require('./routes/announcements')
const calendarEventRoutes = require('./routes/calendarEvents')
const archiveRoutes       = require('./routes/archives')
const commentRoutes       = require('./routes/comments')
const contentPostRoutes   = require('./routes/contentPosts')
const triviaRoutes        = require('./routes/trivia')
const scheduleRoutes      = require('./routes/schedules')
const holidayRoutes       = require('./routes/holidays')

const app = express()

// ---- SECURITY ----
app.use(helmet())

// ---- CORS ----
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-app-name.vercel.app',
    /\.vercel\.app$/,
  ],
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
  credentials: true
}))

// ---- BODY PARSING ----
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ---- GLOBAL RATE LIMIT ----
app.use(globalLimiter)

// ---- MOUNT ROUTES ----
app.use('/api', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/activity-logs', activityLogRoutes)
app.use('/api/sb-council-members', councilMemberRoutes)
app.use('/api/councils', councilRoutes)
app.use('/api/ordinances', ordinanceRoutes)
app.use('/api/resolutions', resolutionRoutes)
app.use('/api/session-minutes', sessionMinuteRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/calendar-events', calendarEventRoutes)
app.use('/api/archives', archiveRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/content-posts', contentPostRoutes)
app.use('/api/trivia', triviaRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/holidays', holidayRoutes)

// ---- GLOBAL ERROR HANDLER ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: err.message || 'Internal server error.' })
})

// ---- START SERVER ----
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))