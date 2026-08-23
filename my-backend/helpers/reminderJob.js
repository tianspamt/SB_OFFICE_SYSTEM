const cron = require('node-cron')
const supabase = require('../config/supabase')
const { notifyAllStaff, notificationEmailHtml } = require('./notify')
const { escapeHtml } = require('./utils')

// Runs once daily: finds official calendar events happening tomorrow that
// haven't been reminded about yet, and notifies all active staff. Personal
// events (is_admin_event: false) are excluded — same privacy reasoning as
// the immediate "new schedule" trigger in routes/calendarEvents.js.
async function sendCalendarReminders() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('start_date', tomorrowStr)
    .eq('is_admin_event', true)
    .eq('reminder_sent', false)
  if (error) {
    console.error('sendCalendarReminders lookup failed:', error.message)
    return
  }

  for (const event of events || []) {
    await notifyAllStaff({
      message: `Reminder: ${event.title} is tomorrow`,
      entityType: 'calendar_event', entityId: event.id,
      emailSubject: `Reminder: ${event.title} — Tomorrow`,
      emailHtml: notificationEmailHtml(
        'Event Tomorrow',
        `This is a reminder that <strong>${escapeHtml(event.title)}</strong> is scheduled for tomorrow, ${escapeHtml(event.start_date)}.`
      ),
    })
    await supabase.from('calendar_events').update({ reminder_sent: true }).eq('id', event.id)
  }
}

// Runs every day at 8:00 AM server time.
cron.schedule('0 8 * * *', sendCalendarReminders)

module.exports = { sendCalendarReminders }
